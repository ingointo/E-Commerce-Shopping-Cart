$('#checkout-form').submit((e) => {
    e.preventDefault()
    $.ajax({
        url: '/place-order',
        method: 'post',
        data: $('#checkout-form').serialize(),
        success: (response) => {
            alert(response)
            alert(response.status)
            alert(response.message)
            if (response.cod_success) {
                location.href = '/order-success'
                // Delete cart
                $.ajax({
                    url: '/delete-cart',
                    method: 'post',
                    success: function(response) {
                        console.log(response);
                    },
                    error: function(error) {
                        console.error(error);
                    }
                });
            } else {
                razorpayPayment(response)

            }
        }
    })
})
function razorpayPayment(order) {
    var options = {
        "key": "rzp_test_6WgoIGyC6t9cPT", // Enter the Key ID generated from the Dashboard
        "amount": order.amount, // Amount is in currency subunits. Default currency is INR. Hence, 50000 refers to 50000 paise
        "currency": "INR",
        "name": "SoftTech",
        "description": "Test Transaction",
        "image": "https://example.com/your_logo",
        "order_id": order.id, //This is a sample Order ID. Pass the `id` obtained in the response of Step 1
        "handler": function (response) {

            verifyPayment(response, order)
        },
        "prefill": {
            "name": "Gaurav Kumar",
            "email": "gaurav.kumar@example.com",
            "contact": "9000090000"
        },
        "notes": {
            "address": "Razorpay Corporate Office"
        },
        "theme": {
            "color": "#3399cc"
        }
    };
    var rzp1 = new Razorpay(options);
    rzp1.on('payment.failed', function (response) {
        console.log(response)
        // Handle payment failure
        location.href = '/payment-failed'
    });
    rzp1.open();

}
function verifyPayment(payment, order) {
    $.ajax({
        url: '/verify-payment',
        data: {
            payment,
            order
        },
        method: 'post',
        success: (response) => {
            if (response.status) {
                location.href = '/order-success'
                // Delete cart
                $.ajax({
                    url: '/delete-cart',
                    method: 'post',
                    success: function(response) {
                        console.log(response);
                    },
                    error: function(error) {
                        console.error(error);
                    }
                });
            } else {
                location.href = '/payment-failed'//order failed
            }
        }
    })
}