// 加载Express模块
const express = require('express');

// 加载MySQL模块
const mysql = require('mysql');

// 加载bodyParser模块
const bodyParser = require('body-parser');

// 加载MD5模块
const md5 = require('md5');

const svgCap = require('svg-captCha');

var session = require('express-session');

// 创建MySQL连接池
const pool = mysql.createPool({
  host: '127.0.0.1',   //MySQL服务器地址
  port: 3306,          //MySQL服务器端口号
  user: 'root',        //数据库用户的用户名
  password: '',        //数据库用户密码
  database: 'clash',    //数据库名称
  connectionLimit: 20, //最大连接数
  charset: 'utf8'      //数据库服务器的编码方式
});

// 创建服务器对象
const app = express();

app.use(session({
  secret:'mykey',
  resave:false,
  saveUninitialized:true,
}))

app.use(bodyParser.urlencoded({
  extended: false
}));

// 加载CORS模块
const cors = require('cors');

// 使用CORS中间件
app.use(cors({
  origin: ['http://localhost:8080', 'http://127.0.0.1:8080']
}));

let answer = '';
// 返回svg图片
app.get('/getcode',(req,res)=>{
  // 生成验证码
  let cap = svgCap.create({
    noise:5
  });
  console.log('生成的验证码是:'+cap.text);
  answer=cap.text;
  res.type('svg');
  // console.log(req.session);
  res.send(cap.data);
})

// 用户注册
app.post('/userreg',(req,res)=>{
  let username = req.body.pho
  let userpwd = req.body.pwd
  let yzm = req.body.yzm
  console.log(answer);
  if(yzm.toUpperCase()!=answer.toUpperCase()){
    res.send({message:'error'})
  }else{
    let picid = Math.floor(Math.random()*24)+1;
    pool.query('select * from user_info where phone = ?',[username],(error,result)=>{
      console.log(result);
      if(result.length!=0){
        res.send({ message: 'phone exits',code:100});
      }else{
        let sql = 'insert into user_info (id,phone,pwd,toppic) VALUES(null,?,md5(?),"/img/toppic/?.png")'
        pool.query(sql, [username,userpwd,picid],(error, results) => {
        if (error) throw error;
        res.send({ message: 'ok', code: 200});
      });
    }
  })
  }
})

// 用户登录
app.post('/userlogin',(req,res)=>{
  console.log(req.body);
  let username = req.body.pho;
  let userpwd = req.body.pwd;
  let sql = 'select * from user_info where phone = ? and pwd = md5(?)'
  pool.query(sql, [username,userpwd],(error, result) => {
    if (error) throw error;
    if(result.length==0){
      res.send({ message: 'error', code: 100});
    }else{
      res.send({ message: 'ok', code: 200,result: result});
    }
  });
})

// 首页所有数据(分页)
app.get('/newsall', (req, res) => {
  res.setHeader('Set-Cookie','SameSite=None')
  console.log(req.query.cid);
  let cid = req.query.cid==0?'热门':req.query.cid==1?'战报':req.query.cid==2?'深度':req.query.cid==3?'采访':'花絮';
  let page = req.query.page? req.query.page : 1;
  console.log(cid,page);
  let pagesize = 10;//每页数据
  let offset = (page - 1) * pagesize;
  let rowcount;//总数
  let sql = 'SELECT COUNT(hi_id) AS count FROM hot_info WHERE hi_type=?';
  pool.query(sql, [cid], (error, results) => {
    if (error) throw error;
    rowcount = results[0].count;
    let pagecount = Math.ceil(rowcount / pagesize);
    // 查询SQL语句
    sql2 = 'SELECT * FROM hot_info WHERE hi_type=? LIMIT ?,?';
    // 执行SQL
    pool.query(sql2, [cid, offset, pagesize], (error, results) => {
      if (error) throw error;
      res.send({ message: 'ok', code: 200, results: results, pagecount: pagecount });
    });
  });

});
  
// 详情页
app.get('/detail', (req, res) => {
  let id = req.query.id;
  console.log(id);
  let sql = 'SELECT * FROM hot_info where hi_id=?';
  // 执行SQL语句
  pool.query(sql, [id],(error, results) => {
    if (error) throw error;
    res.send({ message: 'ok', code: 200, results: results });
  });
});

//轮播图
app.get('/carouse', (req, res) => {
  let id = req.query.id;
  console.log(id);
  let sql = 'SELECT * FROM carouse';
  // 执行SQL语句
  pool.query(sql,(error, results) => {
    if (error) throw error;
    res.send({ message: 'ok', code: 200, results: results });
  });
});

// 十大天王pk数据
app.get('/tenkingpk', (req, res) => {
  let type = req.query.type
  let sql = 'SELECT * FROM palyer where game_type = ?';
  // 执行SQL语句
  pool.query(sql,[type],(error, results) => {
    if (error) throw error;
    res.send({ message: 'ok', code: 200, results: results });
  });
});

// 十大天王选手数据
app.get('/tenkingdata', (req, res) => {
  let sql = 'SELECT * FROM player_data';
  // 执行SQL语句
  pool.query(sql,(error, results) => {
    if (error) throw error;
    res.send({ message: 'ok', code: 200, results: results });
  });
});

// 十大天王卡组数据
app.get('/tenkingcard', (req, res) => {
  let type = req.query.type
  console.log(type);
  let sql = 'SELECT * FROM card_data order by '+type+' desc limit 0,10';
  // 执行SQL语句
  pool.query(sql,(error, results) => {
    if (error) throw error;
    res.send({ message: 'ok', code: 200, results: results });
  });
});

// 十大天王详细战报
app.get('/tenkingdetail', (req, res) => {
  let id = req.query.id
  // console.log(type);
  let sql = 'SELECT * FROM palyer where id=?';
  // 执行SQL语句
  pool.query(sql,[id],(error, results) => {
    if (error) throw error;
    res.send({ message: 'ok', code: 200, results: results });
  });
});

// 用户信息查询
app.get('/selectuser', (req, res) => {
  let phone = req.query.phone
  // console.log(type);
  let sql = 'SELECT * FROM user_info where phone=?';
  // 执行SQL语句
  pool.query(sql,[phone],(error, result) => {
    if (error) throw error;
    res.send({ message: 'ok', code: 200, result: result });
  });
});

// 用户信息修改
app.post('/userup',(req,res)=>{
  console.log(req.body);
  let toppic = req.body.pic;
  let username = req.body.nc;
  let email = req.body.email
  let gameID = req.body.gameID;
  let gamename = req.body.gamename;
  let phone = req.body.phone
  let sql = 'update user_info set toppic=?,username=?,email=?,gameID=?,gamename=? where phone=?';
    pool.query(`select * from user_info where toppic=? and username=? and email=? and gameID=? and gamename=? and phone=?`, [toppic,username,email,gameID,gamename,phone],(error, result) => {
      if (error) throw error;
      if(result.length==1){
        res.send({code:0,msg:'用户未修改'});
      }else{
        pool.query(sql, [toppic,username,email,gameID,gamename,phone],(error, result) => {
          if (error) throw error;
          res.send({code:1,msg:'修改成功'});
        })
      }
    });
})

// 全部商品信息
app.get('/allshop', (req, res) => {
  let sql = 'SELECT * FROM shop_info';
  // 执行SQL语句
  pool.query(sql,(error, result) => {
    if (error) throw error;
    res.send({ message: 'ok', code: 200, result: result });
  });
});

// 商品信息详细信息
app.get('/selectshop', (req, res) => {
  console.log(req.query);
  let id = req.query.id;
  let sql = 'SELECT * FROM shop_info where id = ?';
  // 执行SQL语句
  pool.query(sql,[id],(error, result) => {
    if (error) throw error;
    res.send({ message: 'ok', code: 200, result: result });
  });
});

// 插入订单信息(修改用户,商品信息)
app.post('/userorder',(req,res)=>{
  console.log(req.body);
  var obj = req.body;
  let sql = 'insert into user_order set ?'
  pool.query(sql, [obj],(error, result) => {
    if (error) throw error;
    pool.query('update user_info set goldmoney=goldmoney-?', [obj.or_price]);
    pool.query('update shop_info set sp_other=sp_other-1 where sp_name=?', [obj.or_shop]);
    res.send({ message: 'ok', code: 200});
  });
})

// 查询用户订单
app.get('/selectorder', (req, res) => {
  let phone = req.query.phone;
  // console.log(phone);
  let sql = 'SELECT * FROM user_order where or_phone = ?';
  // 执行SQL语句
  pool.query(sql,[phone],(error, results) => {
    if (error) throw error;
    res.send({ message: 'ok', code: 200, results: results });
  });
});

// 查询竞猜列表
app.get('/selectguess', (req, res) => {
  // let phone = req.query.phone;
  // console.log(phone);
  let sql = 'SELECT * FROM guess_info';
  // 执行SQL语句
  pool.query(sql,(error, results) => {
    if (error) throw error;
    res.send({ message: 'ok', code: 200, results: results });
  });
});

// 插入竞猜项
app.post('/insertguess',(req,res)=>{
  console.log(req.body);
  var obj = req.body;
  let sql = 'insert into guess_detail set ?'
  pool.query(sql, [obj],(error, result) => {
    if (error) throw error;
    pool.query('update user_info set goldmoney=goldmoney-?', [obj.gd_buy]);
    pool.query('update guess_info set gu_sum=gu_sum+? where gu_name=?', [obj.gd_buy,obj.gd_detail]);
    res.send({ message: 'ok', code: 200});
  });
})

// 查询用户下注详情
app.get('/userguess', (req, res) => {
  let phone = req.query.phone;
  // console.log(phone);
  let sql = 'SELECT * FROM guess_detail where gd_phone = ?';
  // 执行SQL语句
  pool.query(sql,[phone],(error, results) => {
    if (error) throw error;
    res.send({ message: 'ok', code: 200, results: results });
  });
});

// CRL视频数据接口
app.get('/crlvideo', (req, res) => {
  // let phone = req.query.phone;
  // console.log(phone);
  let sql = 'SELECT * FROM tenking_video where vi_mouth = "七月"';
  // 执行SQL语句
  pool.query(sql,(error, results) => {
    if (error) throw error;
    res.send({ message: 'ok', code: 200, results: results });
  });
});

// 指定服务器对象监听的端口号
app.listen(3000, () => {
  console.log('server is running...');
});

