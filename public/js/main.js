var books = [];

$(document).ready(function(){
	if(localStorage.getItem("shoppingCart")){
		var total = 0;
		var shoppingCartItems = JSON.parse(localStorage.shoppingCart);
		$.each(shoppingCartItems, function(id, bookItem){
			total += bookItem.quantity*bookItem.bookPrice;
		});
		total = parseFloat(Math.round(total*100)/100).toFixed(2);
		$('#total_badge').text('$'+total);
	}
	//add book to shoppingCart 
	$(document).on('click','#add',function(e){
		var bookId = this.getAttribute('book_id');
		var found = false;

		//create shoppingCart in localStorage
		if(!localStorage.getItem("shoppingCart")){
			localStorage.shoppingCart = JSON.stringify([]);
			//console.log("shoppingCart created");
		}
		//increase quantity for books already in shoppingCart
		var shoppingCartItems = JSON.parse(localStorage.shoppingCart);
		$.each(shoppingCartItems, function(id, bookItem){
			if(bookItem.bookId == bookId){
				bookItem.quantity = parseInt(bookItem.quantity)+1;
				localStorage.shoppingCart = JSON.stringify(shoppingCartItems);
				//console.log(bookItem.bookId+":"+bookItem.quantity);
				found = true;
				return false;
			}
			else{
				return;
			}
		});
		//create and insert the new book in shoppingCart
		if(!found){
			$.ajax({
				type: "GET",
				url: "../retrieve/"+bookId,
				})
				.done(function(data){
					bookItem = {"bookId": bookId, "quantity": 1, "bookName": data.productName, "bookPrice": data.productPrice};
					shoppingCartItems.push(bookItem);
					localStorage.shoppingCart = JSON.stringify(shoppingCartItems);
					var total = 0;
					$.each(shoppingCartItems, function(id, bookItem){
						total += bookItem.quantity*bookItem.bookPrice;
					});
					total = parseFloat(Math.round(total*100)/100).toFixed(2);
					$('#total_badge').text('$'+total);
				});
		}
		var total = 0;
		var shoppingCartItems = JSON.parse(localStorage.shoppingCart);
		$.each(shoppingCartItems, function(id, bookItem){
			total += bookItem.quantity*bookItem.bookPrice;
		});
		total = parseFloat(Math.round(total*100)/100).toFixed(2);
		$('#total_badge').text('$'+total);
	});
	//shoppingCart pop-up
	$(document).on('mouseenter','#shopping_cart',function(e){
		options = {
			trigger: 'manual',
			placement: 'left',
			animation: true,
			html: true,
			title: 'Shopping List',
			content: function(){
				//get book detail and calculate total price
				var shopping_cart_html = "";
				var total = 0;
				if(localStorage.getItem("shoppingCart")){
					var shoppingCartItems = JSON.parse(localStorage.shoppingCart);
					//delete books with quantity=0
					for(var i=0;i<shoppingCartItems.length;i++){
						if(parseInt(shoppingCartItems[i].quantity) == 0){
							shoppingCartItems.splice(i);
						}
					}
					if(shoppingCartItems.length != 0){
						for(var i=0;i<shoppingCartItems.length;i++){
							var book = shoppingCartItems[i];
							var subtotal = book.bookPrice*book.quantity;
							var format_subtotal = parseFloat(Math.round(subtotal*100)/100).toFixed(2);
							total += subtotal;
							shopping_cart_html += '<li><p>'+book.bookName+'</p>'+'<input class="quantity" type="number" min=0 max=100 product_id='+ book.bookId +' value='+ book.quantity+'></input>'+'<p class="subtotal">$'+ format_subtotal +'</p>'+'</li>';
						}
						total = parseFloat(Math.round(total*100)/100).toFixed(2);
						//console.log("total"+total);
						shopping_cart_html += '<h2 id="total">$' +total+'</h2>';
						shopping_cart_html += '<button id="paypal" type="button" class="btn btn-primary btn-large">Checkout</button>';	
					}
					else{
						shopping_cart_html = '<p>Empty</p>';
						total = parseFloat(Math.round(total*100)/100).toFixed(2);
					}
					localStorage.shoppingCart = JSON.stringify(shoppingCartItems);
				}

				$('#total_badge').text('$'+total);
				return shopping_cart_html;
			},
			// container: "body",
			toggle: "popover"
		};
    $(this).popover(options);
  	$(this).popover('show');
  	$('.popover').on('mouseleave',function(){
  		$(this).popover('hide');
  	});
  	$(this).on('mouseleave',function(){
  		var _this = this;
       setTimeout(function () {
            if (!$(".popover:hover").length) {
                $(_this).popover("hide");
            }
       }, 300);
  	});
	});

	$(document).on("input",".quantity",function(e){
		var newQuantity = $(this).val();
		if(!newQuantity){
			newQuantity = 0;
			console.log("hahahha");
		}
		var bookId = this.getAttribute('product_id');
		var shoppingCartItems = JSON.parse(localStorage.shoppingCart);
		var subtotal;
		var total = 0;
		$.each(shoppingCartItems, function(id, book){
			if(book.bookId == bookId){
				book.quantity = newQuantity;
				subtotal = book.bookPrice*book.quantity;
				localStorage.shoppingCart = JSON.stringify(shoppingCartItems);
				return false;
			}
		});
		$(this).next('.subtotal').text('$'+subtotal);
		$.each(shoppingCartItems, function(id, bookItem){
			total += bookItem.quantity*bookItem.bookPrice;
		});
		console.log("total:"+total);
		total = parseFloat(Math.round(total*100)/100).toFixed(2);
		$('#total').text('$'+total);
		$('#total_badge').text('$'+total);
	});

	$(document).on('click','#paypal',function(e){
		if(localStorage.getItem("shoppingCart")){
			var shoppingCartItems = JSON.parse(localStorage.shoppingCart);
			if(shoppingCartItems.length != 0){
				
				var form = document.createElement('form');
    		form.setAttribute('method', 'get');
    		form.setAttribute('action', '../checkout');
    		$.each(shoppingCartItems, function(id, bookItem){
    			var element1 = document.createElement("input");
    			var element2 = document.createElement("input");
    			element1.value = bookItem.bookId;
    			element1.name = 'id';
    			element2.value = bookItem.quantity;
    			element2.name = 'quantity';

					form.appendChild(element1);
    			form.appendChild(element2);

    		});
    		//document.body.appendChild(form);
    		form.submit();
    	}
    	else{
    		alert('Empty shopping cart');
    	}
    }
	});



});