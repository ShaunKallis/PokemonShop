const express = require("express");
const mysql = require("mysql")
const app = express();
const session = require('express-session');

app.set("view engine", "ejs");
app.use(express.static("public")); //folder for images, css, js
app.use(express.urlencoded()); // used to parse data sent using the POST method
// Recall all middleware for app.use executes every time before routes

app.use(session({ 
    secret: 'keyboard cat', 
    cookie: { maxAge: 6000000 }}))
    
app.use(myMiddleware);
function myMiddleware(req, res, next){
    console.log(new Date());
    next(); // passes control to back to server to do the next thing.
}

function isAdminAuthenticated(req, res, next){
    if(!req.session.adminAuthenticated){
        res.redirect('/adminLogin');
    } else {
        next();
    }
}

function isUserAuthenticated(req, res, next){
    if(!req.session.userAuthenticated){
        res.redirect('/userLogin');
    } else {
        next();
    }
}

//routes
app.get("/", function(req, res){

    res.render("index");

});
app.get("/userLogin", async function(req, res)
{
    res.render("userLogin");
});
app.get("/adminLogin", async function(req, res)
{
    res.render("adminLogin");
});


// from lab 10, admin side of page
app.get("/admin", isAdminAuthenticated, async function(req, res){
    console.log("authenticated: ", req.session.authenticated);
    if (req.session.adminAuthenticated){ 
        let productList = await getproductList();
        res.render("admin", {"productList":productList});                
    }else{                                    //if user hasn't authenticated
        res.render("adminLogin");                  //send them to the login screen
    }
});

app.post("/adminLoginProcess", function(req, res) {
     if (req.body.username == "admin" && req.body.password == "secret") {
       req.session.adminAuthenticated = true;
       res.send({"loginSuccess":true});
    } else {
       res.send(false);
    }
});

app.post("/userLoginProcess", function(req, res) {
     if (req.body.username == "user1" && req.body.password == "password1") {
       req.session.userAuthenticated = true;
       res.send({"loginSuccess":true});
    } else {
       res.send(false);
    }
});

app.post("/addToCart", isUserAuthenticated, async function(req, res){
    let rows = await addToCart(req.body.product);
    console.log(rows);
    // res.send("First Name: " + req.body.firstName);  //When POST method info is stored in req.body
    if (rows.affectedRows > 0) {
        res.send({message:"Success!"})
    } else {
        res.send({message:"Failure!"})
    }
})

app.get("/logout", function(req, res){
    req.session.destroy();
    res.redirect("/");   //taking user back to login screen
});
app.get("/addProduct", isAdminAuthenticated, function(req, res){
    if (req.session.adminAuthenticated){ 
        res.render("newProduct");
    }else{                                    //if user hasn't authenticated
        res.render("adminLogin");                  //send them to the login screen
    }
});
app.post("/addProduct", isAdminAuthenticated, async function(req, res){
    let rows = await insertProduct(req.body);
    console.log(rows);
    // res.send("First Name: " + req.body.firstName);  //When POST method info is stored in req.body
    let message = "Product WAS NOT added to the database!";
    if (rows.affectedRows > 0) {
        message = "Product added to the database!";
        res.render("newProduct", {"message":message});
    }
});
app.get("/updateProduct", isAdminAuthenticated, async function(req, res){
    if (req.session.adminAuthenticated){ 
        let productInfo = await getProductInfo2(req.query.productID);
        console.log(productInfo);
        res.render("updateProduct", {"productInfo":productInfo});
    }else{                                    //if user hasn't authenticated
        res.render("adminLogin");                  //send them to the login screen
    }
});
app.post("/updateProduct", isAdminAuthenticated, async function(req, res){
    let rows = await updateProduct(req.body);
    let productInfo = req.body;
    console.log(rows);
    // res.send("First Name: " + req.body.firstName);  //When POST method info is stored in req.body
    let message = "Product WAS NOT updated to the database!";
    if (rows.affectedRows > 0) {
        message = "Product updated to the database!";
        res.render("updateProduct", {"message":message, "productInfo":productInfo});
    }
});
app.get("/deleteProduct", isAdminAuthenticated, async function(req, res){
    let rows = await deleteProduct(req.query.productID);
    console.log(rows);
    let message = "Product WAS NOT deleted!";
    if (rows.affectedRows > 0) {
        message = "Product successfully deleted!";   
        }
    let productList = await getproductList();
    res.render("admin", {"productList":productList});
});


app.post("/stats", isAdminAuthenticated, async function(req, res) {
    res.send(await getStats(req.body.command));
});

app.get("/adminStats", isAdminAuthenticated, function(req, res){

    res.render("adminStatistics");

});


// FUNCTIONS
function insertProduct(body){
    let conn = dbConnection();
    return new Promise(function(resolve, reject){
        conn.connect(function(err) {
            if (err) throw err;
            console.log("Connected!");
            let sql = `INSERT INTO products 
                        (productName, category, description, amtRemaining, price, imageURL) 
                        VALUES (?,?,?,?,?,?)`;            // UPDATE HERE
            let params = [body.productName, body.category, body.description, body.amtRemaining, body.price, body.imageURL]; //in DB it's sex but on our site its gender
            conn.query(sql, params, function (err, rows, fields) {
              if (err) throw err;
              //res.send(rows);
              conn.end();
              resolve(rows);
           });
        });//connect
    });//promise
}
function getproductList(){
    let conn = dbConnection();
    return new Promise(function(resolve, reject){
        conn.connect(function(err) {
            if (err) throw err;
            console.log("Connected!");
            let sql = `SELECT productName, productID 
                        FROM products 
                        ORDER BY productName`;
            conn.query(sql, function (err, rows, fields) {
              if (err) throw err;
              //res.send(rows);
              conn.end();
              resolve(rows);
           });
        });//connect
    });//promise
}
function addToCart(productID){
    let conn = dbConnection();
    return new Promise(function(resolve, reject){
        conn.connect(function(err) {
            if (err) throw err;
            console.log("Connected!");
            //TODO watch out
            let sql = `INSERT INTO cartItems 
                        (cartID, productID, quantity, priceAtPurchase) 
                        VALUES (?,?,?,?)`;
            conn.query(sql, [1, productID, 1, 0], function (err, rows, fields) {
              if (err) throw err;
              //res.send(rows);
              conn.end();
              resolve(rows);
           });
        });//connect
    });//promise
}
function getProductInfo2(productID){
    let conn = dbConnection();
    return new Promise(function(resolve, reject){
        conn.connect(function(err) {
            if (err) throw err;
            console.log("Connected!");
            let sql = `SELECT * 
                        FROM products 
                        WHERE productID = ?`;
            conn.query(sql, [productID], function (err, rows, fields) {
              if (err) throw err;
              //res.send(rows);
              conn.end();
              console.log("here: ", rows[0])
              resolve(rows[0]); //QUERY RETURNS ONLY ONE RECORD
           });
        });//connect
    });//promise
}
function updateProduct(body){
    let conn = dbConnection();
    return new Promise(function(resolve, reject){
        conn.connect(function(err) {
            if (err) throw err;
            console.log("Connected!");
            let sql = `UPDATE products 
                        SET productName = ?, 
                        description = ?,
                        category = ?,
                        amtRemaining = ?,
                        price = ?,
                        imageURL = ?
                        WHERE productID = ?`;         //UPDATE HERE
            let params = [body.productName, body.description, body.category, body.amtRemaining, body.price, body.imageURL, parseInt(body.productID)]; //in DB it's sex but on our site its gender
            console.log(params);
            conn.query(sql, params, function (err, rows, fields) {
              if (err) throw err;
              //res.send(rows);
              conn.end();
              resolve(rows);
           });
        });//connect
    });//promise
}
function deleteProduct(productID){
    let conn = dbConnection();
    return new Promise(function(resolve, reject){
        conn.connect(function(err) {
            if (err) throw err;
            console.log("Connected!");
            let sql = `DELETE FROM products 
                        WHERE productID = ?`;
            let params = [productID]; 
            conn.query(sql, params, function (err, rows, fields) {
              if (err) throw err;
              //res.send(rows);
              conn.end();
              resolve(rows);
           });
        });//connect
    });//promise
}
function clearCart(productID){
    let conn = dbConnection();
    return new Promise(function(resolve, reject){
        conn.connect(function(err) {
            if (err) throw err;
            console.log("Connected!");
            let sql = `DELETE FROM cartItems 
                        WHERE cartID = ?`;
            let params = [1]; 
            conn.query(sql, params, function (err, rows, fields) {
              if (err) throw err;
              //res.send(rows);
              conn.end();
              resolve(rows);
           });
        });//connect
    });//promise
}

function getStats(command){
    
    let conn = dbConnection();
    return new Promise(function(resolve, reject){
        conn.connect(function(err) {
           if (err) throw err;
           console.log("Connected!");
           let sql;
           let aggregate;
            if(command == "MAX"){
                aggregate = "MAX(price)"
                sql = `SELECT ${aggregate} FROM products`;
            } else if(command == "AVG"){
                aggregate = "AVG(price)"
            } else {
                aggregate = "MIN(price)"
            }
            sql = `SELECT ${aggregate} FROM products`;
            
            conn.query(sql, function (err, rows, fields) {
                if (err) throw err;
                //res.send(rows);
                conn.end();
                // console.log(rows[0][aggregate]);
                resolve({"result":rows[0][aggregate]});
            });
        
        });//connect
    });//promise
}//getStats func

app.get("/searchProduct", isUserAuthenticated, async function(req, res){

  let categories = await getCategories();
  //console.log(categories);
  res.render("searchProduct", {"categories":categories});

});

app.get("/cart", isUserAuthenticated, async function(req, res){
//   console.log("happens")
  let items = await getCart();
//   console.log(items);
  let total = 0;
  items.forEach(function(item){
      total += item["price"]*item["quantity"]
  })
  res.render("cart", {"items":items, "total":total});

});

app.get("/checkout", isUserAuthenticated, async function(req, res){

  let categories = await clearCart();
  //console.log(categories);
  res.render("checkout", {"categories":categories});

});

// from lab 9 user side of page
app.get("/products", isUserAuthenticated, async function(req, res){

  let rows = await getProduct(req.query);
  res.render("products", {"records":rows});

});//product

app.get("/productInfo", isUserAuthenticated, async function(req, res){
    
   let rows = await getProductInfo(req.query.productID);
  //res.render("products", {"records":rows});
    res.send(rows)
});//product

function getProductInfo(productID){
    let conn = dbConnection();
    
    
    return new Promise(function(resolve, reject){
        conn.connect(function(err) {
           if (err) throw err;
           console.log("Connected!");
        
           let sql = `SELECT * 
                      FROM products
                      WHERE productID = ${productID}`;
            console.log(sql);        
           conn.query(sql, function (err, rows, fields) {
              if (err) throw err;
              //res.send(rows);
              conn.end();
              resolve(rows);
           });
        
        });//connect
    });//promise
    
}
function getProduct(query){
    
    let keyword = query.keyword;
    let category = query.category;
    let price = query.price;
    let conn = dbConnection();
    
    return new Promise(function(resolve, reject){
        conn.connect(function(err) {
           if (err) throw err;
           console.log("Connected!");
        
           let params = [];
        
           let sql = `SELECT * FROM products
                      WHERE 
                      productName LIKE '%${keyword}%'`; //might use description instead of product
        
           if (query.category) { //user selected a category
              sql += " AND category = ?"; //To prevent SQL injection, SQL statement shouldn't have any product.
              params.push(query.category); 
           }
            
           if (query.price) { //user selected a category
              sql += " AND price = ?"; //To prevent SQL injection, SQL statement shouldn't have any product.
              params.push(query.price);
           }
           
           
        
           console.log("SQL:", sql)
           conn.query(sql, params, function (err, rows, fields) {
              if (err) throw err;
              //res.send(rows);
              conn.end();
              resolve(rows);
           });
        
        });//connect
    });//promise
    
}//getproduct


function getCategories(){
    
    let conn = dbConnection();
    
    return new Promise(function(resolve, reject){
        conn.connect(function(err) {
           if (err) throw err;
           console.log("Connected!");
        
           let sql = `SELECT DISTINCT category 
                      FROM products
                      ORDER BY category`;
        
           conn.query(sql, function (err, rows, fields) {
              if (err) throw err;
              //res.send(rows);
              conn.end();
              resolve(rows);
           });
        
        });//connect
    });//promise
    
}//getCategories

function getCart(){
    
    let conn = dbConnection();
    
    return new Promise(function(resolve, reject){
        conn.connect(function(err) {
           if (err) throw err;
           console.log("Connected!");
        
           let sql = `select productID, quantity, productName, price from users natural join cart natural join cartItems natural join products where userID = "2"`;
        
           conn.query(sql, function (err, rows, fields) {
              if (err) throw err;
              //res.send(rows);
              conn.end();
              resolve(rows);
           });
        
        });//connect
    });//promise
    
}//getCart

//values in red must be updated
function dbConnection(){
   let conn = mysql.createConnection({
                host: "cst336db.space",
                user: "cst336_dbUser7", // cst336_dbUser
                password: "fo14c3",    // secret
                database: "cst336_db7"  // cst336_db
    }); //createConnection
    return conn;
}



//starting server
app.listen(process.env.PORT, process.env.IP, function(){
console.log("Express server is running...");
});