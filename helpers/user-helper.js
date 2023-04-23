const db = require('../config/db')
var collection = require('../config/collections')
const bcrypt = require('bcrypt')
const mongoose = require('mongoose')
const {
    ObjectId
} = mongoose.Types
const Razorpay = require('razorpay')
var instance = new Razorpay({
    key_id: 'rzp_test_6WgoIGyC6t9cPT',
    key_secret: 'EUwLNsFwJAQS337gUQr3v9wD',
});

module.exports = {
    doSignup: (userData) => {
        return new Promise(async (resolve, reject) => {
            // Concatenate Password and Repeat_Password and then hash it using bcrypt with salt rounds
            // userData.Password = await bcrypt.hash(userData.Password + userData.Repeat_Password, 10)
            userData.Password = await bcrypt.hash(userData.Password, 10)
            // Remove the repeated password from user data object
            delete userData.Repeat_Password
            // Insert the user data into the database
            db.collection(collection.USER_COLLECTION).insertOne(userData).then((data) => {
                resolve(data.insertedId)
            })


        })

    },
    doLogin: (userData) => {
        return new Promise(async (resolve, reject) => {
            let loginStatus = false;
            let response = {};
            // User_Email create new user(signup) E-mail, name,..in the hbs, login_Email (login) in hbs email name="login_Email " 
            let user = await db.collection(collection.USER_COLLECTION).findOne({
                User_Email: userData.login_Email
            })
            if (user) {
                bcrypt.compare(userData.Password, user.Password).then((status) => {
                    if (status) {
                        console.log('Login success')
                        response.user = user;
                        response.status = true;
                        resolve(response)
                    } else {
                        console.log('Login failed')
                        resolve({
                            status: false
                        })
                    }
                })
            } else {
                console.log('log in failed')
                resolve({
                    status: false
                })
            }
        })
    },
    addToCart: (productId, userId) => {
        let productObject = {
            item: new ObjectId(productId),
            quantity: 1
        }
        return new Promise(async (resolve, reject) => {
            let userCart = await db.collection(collection.CART_COLLECTION).findOne({
                user: new ObjectId(userId)
            })
            if (userCart) {
                let productExist = userCart.products.findIndex(product => product.item == productId)
                if (productExist >= 0) {
                    // Product already exists in the cart, so update the quantity
                    db.collection(collection.CART_COLLECTION)
                        .updateOne({
                            user: new ObjectId(userId),
                            "products.item": new ObjectId(productId)
                        }, {
                            $inc: {
                                "products.$.quantity": 1
                            }
                        }).then((response) => {
                            resolve()
                        })
                } else {
                    // Product doesn't exist in the cart, so add it
                    db.collection(collection.CART_COLLECTION)
                        .updateOne({
                            user: new ObjectId(userId)
                        }, {
                            $push: {
                                products: productObject
                            }
                        }).then((response) => {
                            resolve()
                        })
                }

            } else {
                let cartObject = {
                    user: new ObjectId(userId),
                    products: [productObject]

                }
                db.collection(collection.CART_COLLECTION).insertOne(cartObject).then((response) => {
                    resolve()
                })
            }
        })
    },
    getCartProducts: (userId) => {
        return new Promise(async (resolve, reject) => {
            try {
                const cartItems = await db.collection(collection.CART_COLLECTION).aggregate([{
                        $match: {
                            user: new ObjectId(userId)
                        }
                    },
                    {
                        $unwind: '$products'
                    },
                    {
                        $project: {
                            item: '$products.item',
                            quantity: '$products.quantity'
                        }
                    },
                    {
                        $lookup: {
                            from: collection.PRODUCT_COLLECTION,
                            localField: 'item',
                            foreignField: '_id',
                            as: 'product'
                        }
                    },
                    //above product is an array we can change the array as object
                    {
                        $project: {
                            item: 1,
                            quantity: 1,
                            product: {
                                $arrayElemAt: ['$product', 0]
                            }
                        }
                    }
                ]).toArray();
                console.log(cartItems)
                if (cartItems.length === 0) {
                    resolve([]);
                } else {
                    resolve(cartItems);
                }
            } catch (error) {
                reject(error);
            }
        });
    },
    getCartCount: (userId) => {
        return new Promise(async (resolve, reject) => {
            let cart = await db.collection(collection.CART_COLLECTION).findOne({
                user: new ObjectId(userId)
            })
            let count = 0;
            if (cart) {
                count = cart.products.length
            }
            resolve(count)
        })
    },
    changeProductQuantity: (details) => {
        details.count = parseInt(details.count);
        details.quantity = parseInt(details.quantity);
        console.log('Details:', details);
        return new Promise((resolve, reject) => {
            if (details.quantity == 1 && details.count == -1) {
                db.collection(collection.CART_COLLECTION)
                    .updateOne({
                        _id: new ObjectId(details.cart)
                    }, {
                        $pull: {
                            products: {
                                item: new ObjectId(details.product)
                            }
                        }
                    })
                    .then((response) => {
                        console.log('Remove Product Response:', response);
                        resolve({
                            removeProduct: true
                        });
                    });
            } else {
                db.collection(collection.CART_COLLECTION)
                    .updateOne({
                        _id: new ObjectId(details.cart),
                        'products.item': new ObjectId(details.product)
                    }, {
                        $inc: {
                            'products.$.quantity': details.count
                        }
                    })
                    .then((response) => {
                        console.log('Update Quantity Response:', response);
                        resolve({
                            status: true
                        }); //when status object gives total value of product in cart 
                    });
            }
        });
    },
    getTotalAmount: async (userId) => {
        try {
            let total = await db.collection(collection.CART_COLLECTION).aggregate([{
                    $match: {
                        user: new ObjectId(userId)
                    }
                },
                {
                    $unwind: '$products'
                },
                {
                    $lookup: {
                        from: collection.PRODUCT_COLLECTION,
                        localField: 'products.item',
                        foreignField: '_id',
                        as: 'product'
                    }
                },
                {
                    $set: {
                        product: {
                            $arrayElemAt: ['$product', 0]
                        }
                    }
                },
                {
                    $group: {
                        _id: null,
                        total: {
                            $sum: {
                                $multiply: [{
                                    $toDouble: "$products.quantity"
                                }, {
                                    $toDouble: "$product.Product_Price"
                                }]
                            }
                        }
                    }
                }
            ]).toArray();
            console.log(total)

            if (total.length === 0) {
                return 0;
            } else {
                return total[0].total;
            }
        } catch (error) {
            return Promise.reject(error); //Returning a rejected promise also helps in situations where the calling function is expecting a promise as a return value. In such cases, if the catch block doesn't return a promise, it can result in an unhandled promise rejection error, which is not desirable
        }
    },
    placeOrder: (userId, order, products, total) => {
        return new Promise(async (resolve, reject) => {
            if (products.length === 0) {
                reject({
                    message: 'Cart is empty'
                });
                return;
            }
            let status = order['payment-method'] === 'COD' ? 'placed' : 'pending'
            const currentDate = new Date();
            const date = currentDate.getDate();
            const month = currentDate.toLocaleString('default', {
                month: 'long'
            });
            const year = currentDate.getFullYear();
            const timeString = currentDate.toLocaleTimeString('en-US', {
                hour: 'numeric',
                minute: 'numeric'
            });


            let orderObject = {
                deliveryDetails: {
                    mobile: order.mobile,
                    name: order.name,
                    address: order.address,
                    city: order.city,
                    pincode: order.pincode,
                    email: order.email
                },
                userId: new ObjectId(userId),
                paymentMethod: order['payment-method'],
                products: products,
                totalAmount: total,
                status: status,
                date: date,
                month: month,
                year: year,
                time: timeString

            }

            try {
                const response = await db.collection(collection.ORDER_COLLECTION).insertOne(orderObject);
                console.log('order placed, orderId:', response.insertedId);
                if (order['payment-method'] === 'COD') {
                    await db.collection(collection.CART_COLLECTION).deleteOne({
                        user: new ObjectId(userId)
                    });
                    console.log('cart deleted for userId:', userId);
                    resolve(response.insertedId);
                } else {
                    resolve(response.insertedId)
                }
            } catch (error) {
                reject(error);
            }
        });
    },
    getCartProductList: async (userId) => {
        return new Promise(async (resolve, reject) => {
            try {
                let cart = await db.collection(collection.CART_COLLECTION).findOne({
                    user: new ObjectId(userId)

                })
                console.log(cart)
                if (cart === null) {
                    resolve([]) //or reject() as per desired behavior
                }
                resolve(cart.products)
                console.log(cart.products)
            } catch (error) {
                reject(error)
            }
        })
    },
    getUserOrders: (userId) => {
        return new Promise(async (resolve, reject) => {
            let orders = await db.collection(collection.ORDER_COLLECTION).find({
                userId: new ObjectId(userId)
            }).toArray()
            console.log(orders)
            resolve(orders)

        })
    },
    getOrderDetails: (orderId) => {
        return new Promise(async (resolve, reject) => {
            try {
                const orderItems = await db.collection(collection.ORDER_COLLECTION).aggregate([{
                        $match: {
                            _id: new ObjectId(orderId)
                        }
                    },
                    {
                        $unwind: '$products'
                    },
                    {
                        $project: {
                            item: '$products.item',
                            quantity: '$products.quantity'
                        }
                    },
                    {
                        $lookup: {
                            from: collection.PRODUCT_COLLECTION,
                            localField: 'item',
                            foreignField: '_id',
                            as: 'product'
                        }
                    },
                    //above product is an array we can change the array as object
                    {
                        $project: {
                            item: 1,
                            quantity: 1,
                            product: {
                                $arrayElemAt: ['$product', 0]
                            }
                        }
                    }
                ]).toArray();
                console.log(orderItems)
                if (orderItems.length === 0) {
                    resolve([]);
                } else {
                    resolve(orderItems);
                }
            } catch (error) {
                reject(error);
            }
        });
    },
    generateRazorpay: (orderId, total) => {
        console.log(orderId)
        return new Promise((resolve, reject) => {
            var options = {
                amount: total * 100, // amount in the smallest currency unit
                currency: "INR",
                receipt: '' + orderId
            };
            instance.orders.create(options, function (err, order) {
                console.log('New Order:', order);
                resolve(order)
            });

        })

    },
    verifyPayment: (details) => {
        return new Promise((resolve, reject) => {
            const {
                createHmac,
            } = require('node:crypto');
            let hmac = createHmac('sha256', 'EUwLNsFwJAQS337gUQr3v9wD');
            hmac.update(details['payment[razorpay_order_id]'] + '|' + details['payment[razorpay_payment_id]']);
            hmac = hmac.digest('hex');
            if (hmac == details['payment[razorpay_signature]']) {
                resolve()
            } else {
                reject()
            }
        })
    },
    changePaymentStatus: (orderId) => {
        return new Promise((resolve, reject) => {
            db.collection(collection.ORDER_COLLECTION).updateOne({
                _id: new ObjectId(orderId)
            }, {
                $set: {
                    status: 'placed'
                }
            }).then(() => {
                resolve()
            })
        })
    },
    deleteCartPaymentSuccessful:async(userId) =>{
        await db.collection(collection.CART_COLLECTION).deleteOne({
            user: new ObjectId(userId)
          });

    },
    deleteCartProduct: (details) => {
        return new Promise((resolve, reject) => {
          db.collection(collection.CART_COLLECTION)
            .updateOne({
              _id: new ObjectId(details.cart)
            }, {
              $pull: {
                products: {
                  item: new ObjectId(details.product)
                }
              }
            })
            .then((response) => {
              console.log('Remove Product Response:', response);
              resolve({
                removeProduct: true
              });
            })
            .catch((error) => {
              console.error(error);
              reject({
                removeProduct: false
              });
            });
        });
      },      
}

