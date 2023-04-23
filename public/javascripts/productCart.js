
//action of view - product hbs file without redirect page, for the specific action
function addToCart(productId) {
    $.ajax({
        url: '/add-to-cart/' + productId,
        method: 'get',
        success: (response) => {
            if (response.status) {
                let count = $('#cart-count').html()
                count = parseInt(count) + 1
                $("#cart-count").html(count)
            }
        }
    });
}

//action of cart hbs + and - count for specific action and display the count 

function changeQuantity(cartId, productId, userId, count) {
    let quantity = parseInt(document.getElementById(productId).innerHTML);
    count = parseInt(count);
    $.ajax({
        url: '/change-product-quantity',
        data: {
            cart: cartId,
            product: productId,
            user:userId, 
            count: count,
            quantity: quantity
        },
        method: 'post',
        success: (response) => {
            console.log('Response:', response);
            if (response.removeProduct) {
                alert("Product Removed From Cart");
                location.reload();
            } else {
                document.getElementById(productId).innerHTML = quantity + count;
                document.getElementById('total').innerHTML = response.total
            }
        }
    });
}

