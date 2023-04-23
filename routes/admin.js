var express = require('express');
var router = express.Router();
const productHelper = require('../helpers/product-helper')
const path = require('path');
const isAdmin = (req, res, next) => {
  if (req.session.admin) {
    next()
  } else {
    res.redirect('/admin/login')
  }
}
/* GET users listing. */
router.get('/', isAdmin, function (req, res, next) {
  let admin = req.session.admin
  productHelper.getAllProducts().then((products) => {
    res.render('admin/view-products', {
      products,
      admin: true,
      isAdmin: admin
    })
  })
});

router.get('/login', (req, res) => {
  if (req.session.admin) {
    res.redirect('/admin')
  } else {
    res.render('admin/login', {
      admin: true,
      'loginErr': req.session.adminLoginErr
    })
    req.session.adminLoginErr = false;
  }
})
//create Admin account
// router.get('/signup', (req, res) => {
//   res.render('admin/signup')
// })
// router.post('/signup', (req, res) => {
//   productHelper.addAdmin(req.body).then((response) => {
//     req.session.admin = response
//     req.session.admin.loggedIn = true;
//     res.redirect('/admin')
//     console.log(req.body)
//   })
// })
router.post('/login', (req, res) => {
  productHelper.adminLogin(req.body).then((response) => {

    if (response.status) {
      req.session.admin = response.admin
      req.session.admin.loggedIn = true;
      res.redirect('/admin')
    } else {
      req.session.adminLoginErr = "Invalid Username Or Password";
      res.redirect('/admin/login')
    }
    console.log('admin js ' + response)
  })
})
router.get('/logout', (req, res) => {
  req.session.admin = null
  res.redirect('/admin')
})
router.get('/add-product', isAdmin, function (req, res) {
  let admin = req.session.admin
  console.log('request sended checking')
  res.render('admin/add-product',{admin: true, isAdmin:admin})
})
router.post('/add-product', (req, res) => {
  console.log(req.body)
  productHelper.addProduct(req.body, (insertedId) => {
    let image = req.files.Product_ImageId
    // ...
    let id = insertedId;
    image.mv(path.join(__dirname, '..', 'public', 'product-images', id + '.jpg'), (err) => {
      let admin = req.session.admin
      if (!err) {
        res.render('admin/add-product',{admin:true, isAdmin:admin});
      } else {
        console.log(err);
      }
    });
  })
})
router.get('/delete-product/:id', (req, res) => {
  let productId = req.params.id
  console.log("delete product id::" + req.params.id)
  productHelper.deleteProduct(productId).then((response) => {
    console.log('response of delete product' + '' + response)
    res.redirect('/admin/')
    console.log('delete product id' + '' + productId)
  })
})
router.get('/edit-product/:id', isAdmin,  async (req, res) => {
  let admin = req.session.admin
  let product = await productHelper.getProductDetails(req.params.id)
  console.log(product)
  res.render('admin/edit-product', {
    product,
    admin:true,
    isAdmin: admin
  })
})
router.post('/edit-product/:id', (req, res) => {
  console.log(req.params.id)
  let id = req.params.id
  productHelper.updateProductDetails(req.params.id, req.body)
  console.log('edited')
  res.redirect('/admin')
  if (req.files.Product_ImageId) {
    let image = req.files.Product_ImageId
    image.mv(path.join(__dirname, '..', 'public', 'product-images', id + '.jpg'))
  }
})

router.get('/user-orders', isAdmin, async (req, res) => {
  let admin = req.session.admin;
  let orders =  await productHelper.getUserOrders()
  console.log(orders)
  res.render('admin/user-orders', {admin:true,
    orders,
     isAdmin:admin})
})

router.get('/shop-users', isAdmin, async (req, res) => {
  let admin = req.session.admin;
  let users = await productHelper.getShopUsers()
  res.render('admin/shop-users', {admin: true, users, isAdmin: admin })
})
module.exports = router;
