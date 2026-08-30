const { getDealerReportDB } = require('../services/dealerService');;

const  getAdminDealerReport = async(requestAnimationFrame,res)=>{
    console.lof('[admin] fetching dealer report');
    try{
        const reportData = await getDealerReportDB()
        return res.status(200).json({
            success:true,
            message:"dealer report genrated successfully",
            data:reportData
        });
    }catch(error){
        console.error('[admin] dealer report error',error.message);
        return res.status(500).json({
            success:false,
            message:"failed to genrated report",
            error:error.messag
        });
    };

};

module.exports = { getAdminDealerReport };