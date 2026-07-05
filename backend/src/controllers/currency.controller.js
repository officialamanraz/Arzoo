const express = require("express");
const app=express();

const currencychange=async(req,res)=>{

    try{
        const response = await fetch('https://fxapi.app/api/INR.json');

        if(!response.ok){
            throw new Error(`External api failed to load data with status:${response.status}`);
        }

        const data = await response.json();

        const formetetdata={};

        for(const currencycode in data.rates){
            const currentrate = data.rates[currencycode];

            const countrycode = currencycode.slice(0, 2).toLowerCase();
            const flagurl=`https://flagcdn.com/w20/${countrycode}.png`;
            
            formetetdata[currencycode]={
                rate:currentrate,
                flag:flagurl
            };
        }
        
        return res.status(200).json(formetetdata);
    } catch(error){
    
        console.error("api fecth error",error.message)

        return res.status(500).json({
            success:false,
            message:"there is server error",
            error:error.message
        });
    };

};

module.exports={currencychange}