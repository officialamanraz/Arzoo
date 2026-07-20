const db = require('../DATABASE/mysql');
const { registerUser } = require('./auth.controller');

const getALLbanners = async(req,res)=> {
    try{
        const [ROWS] = await db.execute(
            'select * from banners where is_active = 1 order by display_order asc'
        );
        return res.json({success:true,
            data:ROWS
        });
    }catch(err){
        console.error("[banner] getALLbanners error:",err.message);
        return res.status(500).json({success:false,
            error:err.message
        })
    }
};
const getALLbannersAdmin= async(req,res)=>{
    try{
        const [ROWS] = await db.execute(
           'select * from banners order by display_order asc'
        );
        res.json({success:true,
            data:ROWS
        });
    }catch(err){
        console.error("[banners] getAllbanners error:",err.message);
        res.status(500).json({
            success:false,
            error:err.message
        });
    };
};

const createbanner = async(req,res)=>{
    try{
        const { title, subtitle, button_text, button_link, display_order } = req.body;
        const image_url = req.file?req.file.filename:null;

        if(!image_url){
            return res.status(400).json({
                success:false,
                error:"image is required"
            });
        };
       const [result] = await db.execute(
    'insert into banners (image_url,title, subtitle, button_text, button_link, display_order) values(?,?,?,?,?,?)',
    [image_url, title || null, subtitle || null, button_text || null, button_link || null, display_order || 0]
);
        return res.status(201).json({
            success:true,
            banner_id:result.insertId
        });
    }catch(err){
        console.error("[BANNER] createbanner errr:",err.message);
        return res.status(500).json({
            success:false,
            error:err.message
        });
    };
};

const updatebanner = async(req,res)=>{
    try{
        const {id} = req.params;
        const {title, subtitle, button_text, button_link, display_order, is_active}=req.body;

        let query = `UPDATE banners SET title=?, subtitle=?, button_text=?, button_link=?, display_order=?, is_active=?`;
        const params = [title || null, subtitle || null, button_text || null, button_link || null, display_order || 0, is_active ?? 1];

        if(req.file){
            query += ',image_url=?';
            params.push(req.file.filename)
        };
         query += ',where banner_id=?';
         params.push(id);
        
         await db.execute(query,params);
         {
            res.json({success:true,
                message:"banner updated"
            });
         }

    }catch(err){
        console.error("[banners] updatebanners err:",err.message);
        return res.status(500).json({
            success:false,
            error:err.message
        });
    };
};

const deleteBanner = async (req, res) => {
  try {
    const { id } = req.params;
    await db.execute('DELETE FROM banners WHERE banner_id = ?', [id]);
    return res.json({ success: true, message: 'Banner deleted' });
  } catch (err) {
    console.error('[BANNER] deleteBanner error:', err.message);
    return res.status(500).json({ success: false, error: err.message });
  }
};

module.exports={
    deleteBanner,
    updatebanner,
    createbanner,
    getALLbannersAdmin,
    getALLbanners
}