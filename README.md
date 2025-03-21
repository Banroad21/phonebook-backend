**TO START THE SERVER**
1. npm install
2. make sure to create **uploads** folder in the same directory with routes, config, middleware
3. npm run server

**IMPORTANT**
1. This server uses MySQL as Database and hosted in **Railway** which is a deployment platform that simplifies deploying web applications and databases by managing the underlying infrastructure. Thus, make sure to update the necessary database and connections. Create tbl_Contacts and tbl_Users

**tbl_Users**
UserID (primary key) [type_serial]
Email [type_text]
Password [type_text]
isAdmin [type_boolean]
isActive [type_boolean]
Status [type_text]

**tbl_Contacts**
ContactID (primary key) [type_serial]
UserID [foreign key] [type_integer]
Firstname [type_text]
Lastname [type_text]
Email [type_text]
ContactNumber [type_integer]
ContactPhoto [type_text]



