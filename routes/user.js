var express = require('express');
var router = express.Router();
const productHelper = require('../helpers/product-helper')
const userHelper = require('../helpers/user-helper')
const verifyLogin = (req, res, next) => {
  if (req.session.user && req.session.user.loggedIn) {
    next()
  } else {
    res.redirect('/login')
  }
}

/* GET home page. */
router.get('/', async function (req, res, next) {
  let user = req.session.user  
  console.log('session user: ' + user)
  let cartCount = null;
  if (user) {
    cartCount = await userHelper.getCartCount(req.session.user._id)
  }
  productHelper.getAllProducts().then((products) => {
    res.render('user/view-products', {
      products,
      user,
      cartCount
    })
  }).catch((err) => {
    console.log(err);
  });
});
router.get('/login', (req, res) => {
  if (req.session.user) {
    res.redirect('/')
  } else {
    res.render('user/login', {
      'loginErr': req.session.userLoginErr
    })
    req.session.userLoginErr = false;
  }
  // res.render('user/login')
})
router.get('/signup', (req, res) => {
  res.render('user/signup')
})
router.post('/signup', (req, res) => {
  userHelper.doSignup(req.body).then((response) => {
    req.session.user = response
    req.session.user.loggedIn = true;
    res.redirect('/')
    console.log(req.body)
  })
})
router.post('/login', (req, res) => {
  userHelper.doLogin(req.body).then((response) => {

    if (response.status) {
      req.session.user = response.user
      req.session.user.loggedIn = true;
      res.redirect('/')
    } else {
      req.session.userLoginErr = "Invalid Username Or Password";
      res.redirect('/login')
    }
    console.log('user js ' + response)
  })
})
router.get('/logout', (req, res) => {
  req.session.user = null;
  if (req.session.user) {
    req.session.user.loggedIn = false;
  }
  res.redirect('/');
});

router.get('/cart', verifyLogin, async (req, res) => {
  let cartCount = null;
  if (req.session.user) {
    cartCount = await userHelper.getCartCount(req.session.user._id)
  }
  let products = await userHelper.getCartProducts(req.session.user._id)
  let totalValue = 0
  if(products.length>0){
     // total value show when increment and decrement in cart
      totalValue = await userHelper.getTotalAmount(req.session.user._id)
  }
   
  res.render('user/cart', {
    products,
    cartCount,
    user: req.session.user._id,
    totalValue
  })
})

router.get('/add-to-cart/:id', (req, res) => {
  console.log('api call')
  userHelper.addToCart(req.params.id, req.session.user._id).then(() => {
    // res.redirect('/')
    res.json({
      status: true
    })
  })
})

router.post('/change-product-quantity', (req, res, next) => {
  userHelper.changeProductQuantity(req.body).then(async (response) => {
      response.total = await userHelper.getTotalAmount(req.body.user)
      console.log('API Response:', response);
      res.json(response);
    })
    .catch((error) => {
      console.error('API Error:', error);
      res.status(500).json({
        error: error.message
      });
    });
});

router.get('/place-order', verifyLogin, async (req, res) => {
  let total = await userHelper.getTotalAmount(req.session.user._id)
  res.render('user/place-order', {
    total,
    user: req.session.user
  })
})

router.post('/place-order', verifyLogin, async (req, res) => {
  let userId = req.session.user._id;
  let products = await userHelper.getCartProductList(userId);
  let totalPrice = await userHelper.getTotalAmount(userId);
  userHelper.placeOrder(userId, req.body, products, totalPrice)
    .then((orderId) => {
      if (req.body['payment-method'] === 'COD') {
        res.json({
          cod_success: true
        });
      } else {
        userHelper.generateRazorpay(orderId, totalPrice).then((response) => {
          res.json(response);
        });
      }
    })
    .catch((error) => {
      console.error(error);
      res.json({
        status: false
      });
    });
});


router.get('/order-success', (req, res) => {
  res.render('user/order-success', {
    user: req.session.user
  })
})
router.get('/orders', verifyLogin, async (req, res) => {
  let userId = req.session.user._id;
  let orders = await userHelper.getUserOrders(userId)

  console.log('Orders In order collection:')
  console.log(orders)
  res.render('user/orders', {
    user: req.session.user,
    orders
  })
})
router.get('/view-order-products/:orderId', verifyLogin, async (req, res) => {
  let products = await userHelper.getOrderDetails(req.params.orderId)
  res.render('user/view-order-products', {
    user: req.session.user,
    products
  })
})
router.post('/verify-payment', (req, res) => {
  console.log(req.body)
  userHelper.verifyPayment(req.body).then(() => {
    userHelper.changePaymentStatus(req.body['order[receipt]']).then(() => {
      console.log('Payment Successful')
      res.json({
        status: true
      })
    })

  }).catch((err) => {
    res.json({
      status: false,
      errMsg: ''
    })
  })
})
router.get('/payment-failed', (req, res) => {
  res.render('user/payment-failed', {
    user: req.session.user
  })
})
router.post('/delete-cart', verifyLogin, async (req, res) =>{
  let userId = req.session.user._id
  userHelper.deleteCartPaymentSuccessful(userId)
})

//delete product from cart
router.post('/delete-product', verifyLogin, async (req, res) => {
  console.log(req.body)
  await userHelper.deleteCartProduct(req.body).then(async (response) => {
    console.log('API Response:', response);
    res.json(response);
  })
  .catch((error) => {
    console.error('API Error:', error);
    res.status(500).json({
      error: error.message
    });
  });
});


module.exports = router;
