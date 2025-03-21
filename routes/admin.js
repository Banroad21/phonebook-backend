const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const bcrypt = require('bcryptjs');
const { check, validationResult } = require('express-validator');

const pool = require('../config/mysql');

// Check Current Password
// @route    POST api/admin//check-current-password/:UserID
// @desc     Authenticate User & get token
// @access   Public
router.post(
  '/check-current-password/:UserID',
  auth,
  check('password', 'Password is required').exists(),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { password } = req.body;

    try {
      const [rows] = await pool.query(
        'SELECT * FROM tbl_Users WHERE UserID = ?',
        [req.params.UserID]
      );

      if (!rows) {
        return res
          .status(400)
          .json({ errors: [{ msg: 'Invalid Credentials' }] });
      }

      const isMatch = await bcrypt.compare(password, rows[0].Password);

      if (!isMatch) {
        return res
          .status(400)
          .json({ errors: [{ msg: 'Incorrect Current Password' }] });
      }

      res.json({ msg: 'Current Password match' });
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server error');
    }
  }
);

// @route    GET api/admin/all-users
// @desc     Get all users
// @access   Private
router.get('/all-users', auth, async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM tbl_Users');

    res.json(rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

//approval of new sign up
// @route    PUT api/admin/approve
// @desc     Update user status
// @access   Private
router.put('/approve-user/:UserID', auth, async (req, res) => {
  try {
    if (!req.params.UserID || isNaN(req.params.UserID)) {
      return res.status(400).json({ error: 'Invalid ID format' });
    }

    const { status } = req.body;

    const [result] = await pool.query(
      'UPDATE tbl_Users SET Status = ?, isActive = ? WHERE UserID = ?',
      [status, true, req.params.UserID]
    );

    if (result.affectedRows === 0) {
      return res.status(400).json({ errors: [{ msg: 'User not found' }] });
    }

    const [updatedUser] = await pool.query(
      'SELECT * FROM tbl_Users WHERE UserID = ?',
      [req.params.UserID]
    );

    res.json(updatedUser[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

//create user
// @route    POST api/admin/create-user
// @desc     Create User
// @access   Private
router.post(
  '/add-user',
  auth,
  check('email', 'Please include a valid email').isEmail(),
  check(
    'password',
    'Please enter a password with 6 or more characters'
  ).isLength({ min: 6 }),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    try {
      const [rows] = await pool.query(
        'SELECT COUNT(*) AS count FROM tbl_Users WHERE email = ?',
        [email]
      );

      if (rows[0].count > 0) {
        return res
          .status(400)
          .json({ errors: [{ msg: 'User already exists' }] });
      } else {
        const salt = await bcrypt.genSalt(10);

        const newPassword = await bcrypt.hash(password, salt);

        //Insert User in the MySQL
        const [result] = await pool.query(
          'INSERT INTO tbl_Users (Email, Password, isAdmin, isActive, Status) VALUES (?, ?, ?, ?, ?)',
          [email, newPassword, 0, 1, 'approved']
        );

        const [newUser] = await pool.query(
          'SELECT * FROM tbl_Users WHERE UserID = ?',
          [result.insertId]
        );

        res.json({ user: newUser[0] });
      }
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  }
);

//update User
// @route    PUT api/admin/update-user
// @desc     Update User
// @access   Private
router.put(
  '/update-user/:UserID',
  auth,
  check('email', 'Please include a valid email').isEmail(),
  async (req, res) => {
    try {
      if (!req.params.UserID || isNaN(req.params.UserID)) {
        return res.status(400).json({ error: 'Invalid ID format' });
      }

      const { email, password } = req.body;

      // check if no password
      if (!password) {
        const [checkUser] = await pool.query(
          'SELECT * FROM tbl_Users WHERE UserID = ?',
          [req.params.UserID]
        );

        await pool.query(
          'UPDATE tbl_Users SET Email = ?, Password = ? WHERE UserID = ?',
          [email, checkUser[0].Password, req.params.UserID]
        );

        const [updatedUser] = await pool.query(
          'SELECT * FROM tbl_Users WHERE UserID = ?',
          [req.params.UserID]
        );

        res.json(updatedUser[0]);
      } else {
        const salt = await bcrypt.genSalt(10);

        const newPassword = await bcrypt.hash(password, salt);

        await pool.query(
          'UPDATE tbl_Users SET Email = ?, Password = ? WHERE UserID = ?',
          [email, newPassword, req.params.UserID]
        );

        const [updatedUser] = await pool.query(
          'SELECT * FROM tbl_Users WHERE UserID = ?',
          [req.params.UserID]
        );

        res.json(updatedUser[0]);
      }
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  }
);

// deletion or deactivation
// @route    DELETE api/admin/user/:UserID
// @desc     Delete User
// @access   Private
router.delete('/delete-user/:UserID', auth, async (req, res) => {
  try {
    if (!req.params.UserID || isNaN(req.params.UserID)) {
      return res.status(400).json({ error: 'Invalid ID format' });
    }

    const [result] = await pool.query(
      'DELETE FROM tbl_Users WHERE UserID = ?',
      [req.params.UserID]
    );

    if (result.affectedRows === 0) {
      return res.status(400).json({ errors: [{ msg: 'User not found' }] });
    }

    res.json({ message: 'User deleted successfully' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
