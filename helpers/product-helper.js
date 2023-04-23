const db = require('../config/db')
var collection = require('../config/collections')
const mongoose = require('mongoose')
const { ObjectId } = mongoose.Types
// const objectId = require('mongodb').ObjectId
const bcrypt = require('bcrypt')


module.exports = {
    
    addAdmin: (adminData) => {
        console.log('server side admin data');
        console.log(adminData);
        return new Promise(async (resolve, reject) => {
          try {
            // Hash the password using bcrypt with salt rounds
            adminData.Password = await bcrypt.hash(adminData.Password, 10);
      
            // Insert the admin data into the database
            const result = await db.collection(collection.ADMIN_COLLECTION).insertOne(adminData);
            resolve(result.insertedId);
          } catch (err) {
            reject(err);
          }
        });
      },
      
      adminLogin: (adminData) => {
        console.log(adminData);
        return new Promise(async (resolve, reject) => {
          try {
            let response = {};
      
            // Find the admin using their email address
            const admin = await db.collection(collection.ADMIN_COLLECTION).findOne({
              Admin_Email: adminData.login_Email
            });
      
            if (admin) {
              // Compare the entered password with the hashed password
              const isPasswordMatch = await bcrypt.compare(adminData.Password, admin.Password);
              if (isPasswordMatch) {
                console.log('Login success');
                response.admin = admin;
                response.status = true;
                resolve(response);
              } else {
                console.log('Login failed');
                resolve({
                  status: false
                });
              }
            } else {
              console.log('log in failed');
              resolve({
                status: false
              });
            }
          } catch (err) {
            reject(err);
          }
        });
      },
    
    addProduct: (product, callback) => {
        const myColl = db.collection(collection.PRODUCT_COLLECTION);
        myColl.insertOne(product).then((data) => {
            console.log(data)
            if (typeof callback == 'function') {
                console.log('Product helpers consoled data' + data.insertedId)
                let id = data.insertedId
                callback(id);

            }

        });
    },
    // Using Promise
    getAllProducts: () => {
        return new Promise(async (resolve, reject) => {
            let products = await db.collection(collection.PRODUCT_COLLECTION).find().toArray()
            resolve(products)
        })

    },
    deleteProduct: (productId) => {
        return new Promise((resolve, reject) => {
            db.collection(collection.PRODUCT_COLLECTION).deleteOne({_id:new ObjectId(productId)}).then((response) => {
                resolve(response)
                console.log('Product Helper .js response'+response)
            })
        })
    }, 
    getProductDetails: (productId) => {
        return new Promise((resolve, reject) => {
            db.collection(collection.PRODUCT_COLLECTION).findOne({_id:new ObjectId(productId)}).then((product) => {
                resolve(product)
                console.log('Resolved Product One Edit Product One is success fully working')
            })
        })
    },
    updateProductDetails: (productId, productDetails) => {
        return new Promise((resolve, reject) => {
            db.collection(collection.PRODUCT_COLLECTION).updateOne
            ({_id:new ObjectId(productId)},{
                $set: {
                    Product_Name:productDetails.Product_Name,
                    Product_Brand:productDetails.Product_Brand,
                    Product_Price:productDetails.Product_Price,
                    Product_Description: productDetails.Product_Description
                }
            }).then((response) => {
                resolve()
            })
        })
    },
    getUserOrders: () => {
      return new Promise(async (resolve, reject) => {
          let orders = await db.collection(collection.ORDER_COLLECTION).find().toArray();
          resolve(orders);
      });
  },
  getShopUsers: () => {
    return new Promise(async(resolve, reject) => {
      let users = await db.collection(collection.USER_COLLECTION).find().toArray();
      resolve(users)
    })
  }
};