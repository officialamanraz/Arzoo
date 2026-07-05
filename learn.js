// let product = document.getElementById("product");
// console.dir(product);

// let product = document.getElementsByClassName("price");
// console.dir(product)
// console.log(product)

// let firstel = document.querySelector(".product-card");
// console.dir(firstel);
// console.log(firstel);

// let allel = document.querySelectorAll(".product-card");
// console.log(allel)
// console.dir(allel)  

// let div = document.querySelector("div");
// console.log(div);

// let id =div.getAttribute("id");
// console.log(id) 
//  let btn1 = document.querySelector("#button");
//  btn1.onclick = (e) => {
//     console.log("btn1 was clicker");
//     console.log(evt);
//     console.log(evt.type);
//     console.log(evt.target);
//     console.log(evt.clientx,evt.clienty);
//     let a = 25;
//     a++;
//     console.log(a);
 
// };
// let img = document.querySelector("#img");
// img.onmouseover = (evt) => {
//     console.log("you are inside product")
//     console.log(evt);
//     console.log(evt.type);
//     console.log(evt.target);
//     console.log(evt.clientx,evt.clienty);
// }

// let btn1 = document.getElementById("btn1");
// btn1.addEventListener("click",()=>{
//     console.log("button was clicked- handler"); 
// });

// let products = document.querySelectorAll(".product-card");
// products.forEach((product)=>{
//     product.addEventListener("click",(e) =>{
//     e.preventDefault();
//     console.log("product was click-handler2");
//     console.log(e);
// });    console.log(e.type);
//     console.log(e.target);
//     console.log(e.clientx,evt.clienty);
// });


let modebtn = document.querySelector("#mode-changer");
let curruntmode = "light";
if(modebtn){   
     modebtn.addEventListener("click",() =>{
    if(curruntmode==="light"){
        curruntmode="dark";
        modebtn.innertext="☀️";
      document.querySelector("body").style.backgroundColor="black";
      document.querySelector("nav").style.backgroundColor="black";
      document.querySelectorAll(".nav-links a ").forEach((links)=>{
        links.style.color="white"
      });
      document.querySelectorAll(".product-card").forEach((product)=>{
     product.style.backgroundColor="black";
    })
    document.querySelectorAll(".product-name").forEach((product)=>{
        product.style.color="white"
    });
}
    else{
        curruntmode="light";
        modebtn.innertext="🌙";
        document.querySelector("body").style.backgroundColor="white";
        document.querySelector("nav").style.backgroundColor="white";
        document.querySelectorAll(".nav-links").forEach((nav)=>{
        nav.style.color="black";
        })
        document.querySelectorAll(".product-card").forEach((product)=>{
        product.style.backgroundColor="light";})
           document.querySelectorAll(".product-name").forEach((product)=>{
        product.style.color="black";
    })
    }
    console.log(curruntmode);
});}


const urlparams = new URLSearchParams(window.location.search);
const coughtId = urlparams.get("id");
const getId = document.querySelector("#display");
const AmanProduct=[
    {
        "id": 1,
        "title": "Purple tree saree kota doria",
        "price": 100000,
        "thumbnail": "saare_2.jpeg",
        "more-detail": {
            "primary color": "purple",
            "other color": "silver and more purple",
            "border type": "simple",
            "pattern": "none",
            "Craft": "skilled",
            "weave": "none",
            "zari type": "pure silver & gold zari",
            "blouse": "none",
            "border motifs": "none",
            "origin": "proudly handcrafted in kaithoon kota raj. india",
            "fabric/material": "silky & zari gold(kota doria)",
            "khats": "kota doria specialty box pattern"
        },
        "measurement": {
            "product weight": "none",
            "blouse length": "none", 
            "saree length": "none",
            "saree width": "none"
        }
    },
    {
        "id": 2,
        "title": "Bird design with tree saree kota doria",
        "price": 210000,
        "thumbnail": "saare_3.jpeg",
        "more-detail": {
            "primary color": "cyan",
            "other color": "gold and mix of color",
            "border type": "bird design with mix color",
            "pattern": "none",
            "Craft": "skilled",
            "weave": "none",
            "zari type": "pure silver & gold zari",
            "blouse": "none",
            "border motifs": "none",
            "origin": "proudly handcrafted in kaithoon kota raj. india",
            "fabric/material": "silky & zari gold(kota doria)",
            "khats": "kota doria specialty box pattern"
        },
        "measurement": {
            "product weight": "none",
            "blouse length": "none", 
            "saree length": "none",
            "saree width": "none"
        }
    },
    {
        "id": 3,
        "title": "Parrot design saree kota",
        "price": 120000,
        "thumbnail": "saare_4.jpeg",
        "more-detail": {
            "primary color": "cream",
            "other color": "pink",
            "border type": "simple",
            "pattern": "none",
            "Craft": "skilled",
            "weave": "none",
            "zari type": "pure silver & gold zari",
            "blouse": "none",
            "border motifs": "none",
            "origin": "proudly handcrafted in kaithoon kota raj. india",
            "fabric/material": "silky & zari gold(kota doria)",
            "khats": "kota doria specialty box pattern"
        },
        "measurement": {
            "product weight": "none",
            "blouse length": "none", 
            "saree length": "none",
            "saree width": "none"
        }
    },
    {
        "id": 4,
        "title": "Peacock design saree kota doria",
        "price": 500000,
        "thumbnail": "saare_5.jpeg",
        "more-detail": {
            "primary color": "light dark gold",
            "other color": "gold",
            "border type": "embroidered",
            "pattern": "none",
            "Craft": "skilled",
            "weave": "none",
            "zari type": "pure silver & gold zari",
            "blouse": "none",
            "border motifs": "none",
            "origin": "proudly handcrafted in kaithoon kota raj. india",
            "fabric/material": "silky & zari gold(kota doria)",
            "khats": "kota doria specialty box pattern"
        },
        "measurement": {
            "product weight": "none",
            "blouse length": "none", 
            "saree length": "none",
            "saree width": "none"
        }
    },
    {
        "id": 5,
        "title": "Yellow with flower design",
        "price": 345000,
        "thumbnail": "saare_6.jpeg",
        "more-detail": {
            "primary color": "yellow",
            "other color": "green",
            "border type": "silver embroidered",
            "pattern": "none",
            "Craft": "skilled",
            "weave": "none",
            "zari type": "pure silver & gold zari",
            "blouse": "none",
            "border motifs": "none",
            "origin": "proudly handcrafted in kaithoon kota raj. india",
            "fabric/material": "silky & zari gold(kota doria)",
            "khats": "kota doria specialty box pattern"
        },
        "measurement": {
            "product weight": "none",
            "blouse length": "none", 
            "saree length": "none",
            "saree width": "none"
        }
    },
    {
        "id": 6,
        "title": "Rainbow flower design saree",
        "price": 1250000,
        "thumbnail": "saare_7.jpeg",
        "more-detail": {
            "primary color": "mix color",
            "other color": "mix color",
            "border type": "embroidered",
            "pattern": "none",
            "Craft": "skilled",
            "weave": "none",
            "zari type": "pure silver & gold zari",
            "blouse": "none",
            "border motifs": "none",
            "origin": "proudly handcrafted in kaithoon kota raj. india",
            "fabric/material": "silky & zari gold(kota doria)",
            "khats": "kota doria specialty box pattern"
        },
        "measurement": {
            "product weight": "none",
            "blouse length": "none", 
            "saree length": "none",
            "saree width": "none"
        }
    },
    {
        "id": 7,
        "title": "Blue color buta style saree kota doria",
        "price": 130000,
        "thumbnail": "saare_8.jpeg",
        "more-detail": {
            "primary color": "sea blue",
            "other color": "dots of color",
            "border type": "embroidered of flower",
            "pattern": "none",
            "Craft": "skilled",
            "weave": "none",
            "zari type": "pure silver & gold zari",
            "blouse": "none",
            "border motifs": "none",
            "origin": "proudly handcrafted in kaithoon kota raj. india",
            "fabric/material": "silky & zari gold(kota doria)",
            "khats": "kota doria specialty box pattern"
        },
        "measurement": {
            "product weight": "none",
            "blouse length": "none", 
            "saree length": "none",
            "saree width": "none"
        }
    },
    {
        "id": 8,
        "title": "Pink color buta style saree kota doria",
        "price": 345000,
        "thumbnail": "saare_9.jpeg",
        "more-detail": {
            "primary color": "pink",
            "other color": "other color",
            "border type": "simple",
            "pattern": "none",
            "Craft": "skilled",
            "weave": "none",
            "zari type": "pure silver & gold zari",
            "blouse": "none",
            "border motifs": "none",
            "origin": "proudly handcrafted in kaithoon kota raj. india",
            "fabric/material": "silky & zari gold(kota doria)",
            "khats": "kota doria specialty box pattern"
        },
        "measurement": {
            "product weight": "none",
            "blouse length": "none", 
            "saree length": "none",
            "saree width": "none"
        }
    },
    {
        "id": 9,
        "title": "Leaf flower style design saree kota doria",
        "price": 230000,
        "thumbnail": "saare_10.jpeg",
        "more-detail": {
            "primary color": "almond",
            "other color": "mix of green color",
            "border type": "simple",
            "pattern": "none",
            "Craft": "skilled",
            "weave": "none",
            "zari type": "pure silver & gold zari",
            "blouse": "none",
            "border motifs": "none",
            "origin": "proudly handcrafted in kaithoon kota raj. india",
            "fabric/material": "silky & zari gold(kota doria)",
            "khats": "kota doria specialty box pattern"
        },
        "measurement": {
            "product weight": "none",
            "blouse length": "none", 
            "saree length": "none",
            "saree width": "none"
        }
    },
    {
        "id": 10,
        "title": "Cow with flower saree kota doria",
        "price": 1230000,
        "thumbnail": "saare_11.jpeg",
        "more-detail": {
            "primary color": "pista",
            "other color": "white",
            "border type": "simple",
            "pattern": "none",
            "Craft": "skilled",
            "weave": "none",
            "zari type": "pure silver & gold zari",
            "blouse": "none",
            "border motifs": "none",
            "origin": "proudly handcrafted in kaithoon kota raj. india",
            "fabric/material": "silky & zari gold(kota doria)",
            "khats": "kota doria specialty box pattern"
        },
        "measurement": {
            "product weight": "none",
            "blouse length": "none", 
            "saree length": "none",
            "saree width": "none"
        }
    },
    {
        "id": 11,
        "title": "Sparrow with silver line saree kota doria",
        "price": 450000,
        "thumbnail": "saare_12.jpeg",
        "more-detail": {
            "primary color": "red",
            "other color": "mix color",
            "border type": "embroidered",
            "pattern": "none",
            "Craft": "skilled",
            "weave": "none",
            "zari type": "pure silver & gold zari",
            "blouse": "none",
            "border motifs": "none",
            "origin": "proudly handcrafted in kaithoon kota raj. india",
            "fabric/material": "silky & zari gold(kota doria)",
            "khats": "kota doria specialty box pattern"
        },
        "measurement": {
            "product weight": "none",
            "blouse length": "none", 
            "saree length": "none",
            "saree width": "none"
        }
    },
    {
        "id": 12,
        "title": "Simple design saree kota doria",
        "price": 340000,
        "thumbnail": "saare_13.jpeg",
        "more-detail": {
            "primary color": "queen color",
            "other color": "mix color",
            "border type": "embroidered",
            "pattern": "none",
            "Craft": "skilled",
            "weave": "none",
            "zari type": "pure silver & gold zari",
            "blouse": "none",
            "border motifs": "none",
            "origin": "proudly handcrafted in kaithoon kota raj. india",
            "fabric/material": "silky & zari gold(kota doria)",
            "khats": "kota doria specialty box pattern"
        },
        "measurement": {
            "product weight": "none",
            "blouse length": "none", 
            "saree length": "none",
            "saree width": "none"
        }
    },
    {
        "id": 13,
        "title": "Mandala flower design kota doria saree",
        "price": 1213000,
        "thumbnail": "saare_14.jpeg",
        "more-detail": {
            "primary color": "light purple",
            "other color": "light green",
            "border type": "simple",
            "pattern": "none",
            "Craft": "skilled",
            "weave": "none",
            "zari type": "pure silver & gold zari",
            "blouse": "none",
            "border motifs": "none",
            "origin": "proudly handcrafted in kaithoon kota raj. india",
            "fabric/material": "silky & zari gold(kota doria)",
            "khats": "kota doria specialty box pattern"
        },
        "measurement": {
            "product weight": "none",
            "blouse length": "none", 
            "saree length": "none",
            "saree width": "none"
        }
    },
    {
        "id": 14,
        "title": "Simple design saree",
        "price": 500000,
        "thumbnail": "saare_15.jpeg",
        "more-detail": {
            "primary color": "heavy orange",
            "other color": "heavy orange",
            "border type": "simple",
            "pattern": "none",
            "Craft": "skilled",
            "weave": "none",
            "zari type": "pure silver & gold zari",
            "blouse": "none",
            "border motifs": "none",
            "origin": "proudly handcrafted in kaithoon kota raj. india",
            "fabric/material": "silky & zari gold(kota doria)",
            "khats": "kota doria specialty box pattern"
        },
        "measurement": {
            "product weight": "none",
            "blouse length": "none", 
            "saree length": "none",
            "saree width": "none"
        }
    },
    {
        "id": 15,
        "title": "Elephant embroidered design",
        "price": 230000,
        "thumbnail": "saare_16.jpeg",
        "more-detail": {
            "primary color": "dark orange",
            "other color": "gold",
            "border type": "embroidered",
            "pattern": "none",
            "Craft": "skilled",
            "weave": "none",
            "zari type": "pure silver & gold zari",
            "blouse": "none",
            "border motifs": "none",
            "origin": "proudly handcrafted in kaithoon kota raj. india",
            "fabric/material": "silky & zari gold(kota doria)",
            "khats": "kota doria specialty box pattern"
        },
        "measurement": {
            "product weight": "none",
            "blouse length": "none", 
            "saree length": "none",
            "saree width": "none"
        }
    },
    {
        "id": 16,
        "title": "Seagull design kota doria",
        "price": 100000,
        "thumbnail": "saare_17.jpeg",
        "more-detail": {
            "primary color": "heavy orange",
            "other color": "mix color",
            "border type": "embroidered",
            "pattern": "none",
            "Craft": "skilled",
            "weave": "none",
            "zari type": "pure silver & gold zari",
            "blouse": "none",
            "border motifs": "none",
            "origin": "proudly handcrafted in kaithoon kota raj. india",
            "fabric/material": "silky & zari gold(kota doria)",
            "khats": "kota doria specialty box pattern"
        },
        "measurement": {
            "product weight": "none",
            "blouse length": "none", 
            "saree length": "none",
            "saree width": "none"
        }
    },
    {
        "id": 17,
        "title": "Sparrow couple design kota doria",
        "price": 140000,
        "thumbnail": "saare_18.jpeg",
        "more-detail": {
            "primary color": "heavy green",
            "other color": "mix of other color",
            "border type": "simple",
            "pattern": "none",
            "Craft": "skilled",
            "weave": "none",
            "zari type": "pure silver & gold zari",
            "blouse": "none",
            "border motifs": "none",
            "origin": "proudly handcrafted in kaithoon kota raj. india",
            "fabric/material": "silky & zari gold(kota doria)",
            "khats": "kota doria specialty box pattern"
        },
        "measurement": {
            "product weight": "none",
            "blouse length": "none", 
            "saree length": "none",
            "saree width": "none"
        }
    },
    {
        "id": 18,
        "title": "Bird design with tree saree kota doria (Variant)",
        "price": 100000,
        "thumbnail": "saare_18.jpeg",
        "more-detail": {
            "primary color": "cyan",
            "other color": "gold and mix of color",
            "border type": "bird design with mix color",
            "pattern": "none",
            "Craft": "skilled",
            "weave": "none",
            "zari type": "pure silver & gold zari",
            "blouse": "none",
            "border motifs": "none",
            "origin": "proudly handcrafted in kaithoon kota raj. india",
            "fabric/material": "silky & zari gold(kota doria)",
            "khats": "kota doria specialty box pattern"
        },
        "measurement": {
            "product weight": "none",
            "blouse length": "none", 
            "saree length": "none",
            "saree width": "none"
        }
    },
    {
        "id": 19,
        "title": "Duck style kota doria saree",
        "price": 240000,
        "thumbnail": "saare_20.jpeg",
        "more-detail": {
            "primary color": "sea light blue",
            "other color": "white",
            "border type": "embroidered",
            "pattern": "none",
            "Craft": "skilled",
            "weave": "none",
            "zari type": "pure silver & gold zari",
            "blouse": "none",
            "border motifs": "none",
            "origin": "proudly handcrafted in kaithoon kota raj. india",
            "fabric/material": "silky & zari gold(kota doria)",
            "khats": "kota doria specialty box pattern"
        },
        "measurement": {
            "product weight": "none",
            "blouse length": "none", 
            "saree length": "none",
            "saree width": "none"
        }
    }
];
for(let i = 0;i<AmanProduct.length;i++){
    let getthumnail = AmanProduct[i].thumbnail;
    let gettitle = AmanProduct[i].title;
    let getprice = AmanProduct[i].price;
    let getcolor = AmanProduct[i]["more-detail"]["primary color"];
    let getothercolor = AmanProduct[i]["more-detail"][ "other color"];
    let getbordertypse =  AmanProduct[i]["more-detail"][ "border type"];
    let getpattern =  AmanProduct[i]["more-detail"][ "pattern"];
    let getcraft =  AmanProduct[i]["more-detail"][ "craft"];
    let getweave =  AmanProduct[i]["more-detail"][ "weave"];
    let getzaritype =  AmanProduct[i]["more-detail"][ "zari type"];
    let getblouse =  AmanProduct[i]["more-detail"][ "blouse"];
    let getbordermotifs =  AmanProduct[i]["more-detail"][ "border motifs"];
    let getorigin =  AmanProduct[i]["more-detail"][ "origin"];
    let getfabric =  AmanProduct[i]["more-detail"][ "fabric/material"];
    let getkhats =  AmanProduct[i]["more-detail"][ "khats"];
    let getproductweight = AmanProduct[i]["measurement"]["product weight"];
    let getblouselength = AmanProduct[i]["measurement"]["blouse length"];
    let getsaarelength = AmanProduct[i]["measurement"]["saree length"];
    let getwidth = AmanProduct[i]["measurement"]["saree width"];
    
   // ... (Aapke saare variables waise hi rahenge) ...

    if(AmanProduct[i].id == coughtId) {
        
        console.log(getthumnail);
        console.log("name:", gettitle);
        console.log("Price: ₹", getprice); // Yahan maine getprice theek kar diya hai
        
        console.log("\n📦 --- MORE DETAILS ---"); // \n lagane se console mein ek line ka gap (enter) aa jata hai
        console.log("Primary Color:", getcolor);
        console.log("Other Color:", getothercolor);
        console.log("Border Type:", getbordertypse);
        console.log("Pattern:", getpattern);
        console.log("Craft:", getcraft);
        console.log("Weave:", getweave);
        console.log("Zari Type:", getzaritype);
        console.log("Blouse:", getblouse);
        console.log("Border Motifs:", getbordermotifs);
        console.log("Origin:", getorigin);
        console.log("Fabric:", getfabric);
        console.log("Khats:", getkhats);
        
        console.log("\n📏 --- MEASUREMENTS ---");
        console.log("Product Weight:", getproductweight);
        console.log("Blouse Length:", getblouselength);
        console.log("Saree Length:", getsaarelength);
        console.log("Saree Width:", getwidth);
    }
  if(AmanProduct[i].id == coughtId) {
        
        // Aapke purane Console logs (ise change nahi kiya)
        console.log(getthumnail);
        console.log("name:", gettitle);
        console.log("Price: ₹", getprice); 
        console.log("\n📦 --- MORE DETAILS ---"); 
        console.log("Primary Color:", getcolor);
        console.log("Other Color:", getothercolor);
        console.log("Border Type:", getbordertypse);
        console.log("Pattern:", getpattern);
        console.log("Craft:", getcraft);
        console.log("Weave:", getweave);
        console.log("Zari Type:", getzaritype);
        console.log("Blouse:", getblouse);
        console.log("Border Motifs:", getbordermotifs);
        console.log("Origin:", getorigin);
        console.log("Fabric:", getfabric);
        console.log("Khats:", getkhats);
        console.log("\n📏 --- MEASUREMENTS ---");
        console.log("Product Weight:", getproductweight);
        console.log("Blouse Length:", getblouselength);
        console.log("Saree Length:", getsaarelength);
        console.log("Saree Width:", getwidth);

        // --- NAYA ADDITION: Screen par print karne ke liye ---
        let displayBox = document.querySelector("#display");
        if(displayBox) {
            displayBox.innerHTML = `
                <div class="details-container">
                    <img src="${getthumnail}" alt="${gettitle}">
                    <div class="info-box">
                        <h1>${gettitle}</h1>
                        <div class="price">₹${getprice}</div>
                        <div class="btn"> <button class="cart-btn" onclick="addToCart(${title},${price})">add to cart</button>
                        </div>
                        
                        <div class="details-list">
                            <h3>📦 More Details</h3>
                            <p><b>Primary Color:</b> ${getcolor}</p>
                            <p><b>Fabric/Material:</b> ${getfabric}</p>
                            <p><b>Craft:</b> ${getcraft}</p>
                            <p><b>Border Type:</b> ${getbordertypse}</p>
                            <p><b>Origin:</b> ${getorigin}</p>
                            
                            <h3 style="margin-top: 20px;">📏 Measurements</h3>
                            <p><b>Product Weight:</b> ${getproductweight}</p>
                            <p><b>Saree Length:</b> ${getsaarelength}</p>
                            <p><b>Blouse Length:</b> ${getblouselength}</p>
                </div>
            `;
        }
    }  
}

const container=document.querySelector("#cart-container");
const clear = document.querySelector("#clear-btn");
let cart=JSON.parse(localStorage.getItem("AmanProduct"))||[];
if(cart.length==0){
    container.innerHTML=`<h3>your cart is empty</h3>`;
}
else{
    let total=0;
}

for(let i=0;i<cart.length;i++){
    let title = cart[i].title;
    let price= cart[i].price;

    total=price+total;

    container.innerHTML +=`<div class="cart-item">
    <div>
    <p class="cart-title">${title}</p>
    <p class="cart-price">price:$${price}</p>
    </div>
    <button class="remove-btn" onclick="removeItem(${i})">Remove</button>
    </div>`;
}

const totalbill=document.querySelector("#total-bill");
totalbill.innerHTML=`total bill:$${total}`;

clear.addEventListener("click",()=>{
     localStorage.removeItem("AmanProduct");
     window.location.reload();
});

function removeItem(index){
    let cart=JSON.Parse(localStorage.getItem("AmanProduct"));
    cart.splice(index,1);
    localStorage.setItem("AmanProduct",JSON.stringify(cart));
    window.location.reload();
}

function addToCart(producttitle,productprice,productthumbnail){
    let newitem = {
        title:producttitle,
        price:productprice,
        thumbnail:productthumbnail
    };

    let cart = JSON.Parse(localStorage.getItem("AmanProduct")) ||[];
      

    cart.push(newitem);

    localStorage.setItem("AmanProduct",JSON.stringify(cart));

    for(let i=0;i<data.products.length; i++){
        let thumb = data.products[i].thumnail;
        let price =data.products[i].price;
        let title =data.products[i].title;

    container.innerHTML +=`
        <div class="product-car">
        <img src="${thumb}" alt="${title}">
        <p class="product-title">${title}</p>
        <p class="product-price">price:$${price}</p>
        <button class="cart-btn" onclick="addToCart(${title},${price})">add to cart</button>
        </div>`;

    }
    
}
