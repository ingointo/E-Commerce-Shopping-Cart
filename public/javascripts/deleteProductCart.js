function deleteProduct(cartId, productId, userId) {
    if (confirm('Are you sure want to delete this product?')) {
        $.ajax({
            url: '/delete-product',
            data: {
                cart: cartId,
                product: productId,
                user: userId
            },
            method: 'post',
            success: function (response) {
                if (response.removeProduct) {
                    /* alert('Product removed from cart...')*/
                    location.reload() /* reload the page after product is deleted */
                }

            }

        })

    }

}

