const db = require('../DATABASE/mysql');
const { getFullImageUrl } = require('../utils/imageUtils');
const getbannerbydb = async()=>{
    const [ROWS] = await db.execute(
            'select * from banners where is_active = 1 order by display_order asc'
        );
    const formattbanner = ROWS.map(banner =>({
        ...banner,
        image_url: getFullImageUrl(banner.image_url)
    }));
    return formattbanner
};

const getALLbannersAdminbydb = async() =>{
    const [ROWS] = await db.execute(
           'select * from banners order by display_order asc'
        );
        const formattedBanners = ROWS.map(banner => ({
        ...banner,
        image_url: getFullImageUrl(banner.image_url)
    }));

    return formattedBanners;
};

const createbannerindb = async(bannerdata,image_url) =>{
    const { title, subtitle, button_text, button_link, display_order} =bannerdata;
    const [result] = await db.execute(
    'insert into banners (image_url,title, subtitle, button_text, button_link, display_order, is_active) values(?,?,?,?,?,?,?)',
    [image_url, title || null, subtitle || null, button_text || null, button_link || null, display_order || 0, 1]
); 
return result.insertId;
};

const updatebannerindb = async(id,bannerdata,image_url) =>{
      const {title, subtitle, button_text, button_link, display_order, is_active}=bannerdata
       let query = `UPDATE banners SET title=?, subtitle=?, button_text=?, button_link=?, display_order=?, is_active=?`;
        const params = [title || null, subtitle || null, button_text || null, button_link || null, display_order || 0, is_active ?? 1];
        if (image_url) {
        query += `, image_url=?`;
        params.push(image_url);
    }

    // 3. Aakhir mein WHERE condition lagao
    query += ` WHERE banner_id=?`;
    params.push(Number(id));

    // 4. Query Execute karo
    const [result] = await db.execute(query, params);

    // 5. Check karo ki kya banner sach mein tha DB mein
    if (result.affectedRows === 0) {
        throw new Error('BANNER_NOT_FOUND');
    }

    return true; // Sa

};

// File: src/services/bannerService.js

const deleteBannerindb = async (id) => {
    const [result] = await db.execute('DELETE FROM banners WHERE banner_id = ?', [id]);
    
    // Agar affectedRows 0 hai, matlab banner tha hi nahi
    if (result.affectedRows === 0) {
        throw new Error('BANNER_NOT_FOUND');
    }
    
    return true; // Delete successful
};

// module.exports mein isko add kar lena
module.exports={
    deleteBannerindb,
    updatebannerindb,
    createbannerindb,
    getALLbannersAdminbydb,
    getbannerbydb
}