// 加载Express模块
const express = require('express');

// 加载MySQL模块
const mysql = require('mysql');

// 加载bodyParser模块
const bodyParser = require('body-parser');

// 加载MD5模块
const md5 = require('md5');

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

app.use(bodyParser.urlencoded({
  extended: false
}));


// 加载CORS模块
const cors = require('cors');

// 使用CORS中间件
app.use(cors({
  origin: ['http://localhost:8080', 'http://127.0.0.1:8080','https://m.crlcn.com/#/']
}));

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


// 指定服务器对象监听的端口号
app.listen(3000, () => {
  console.log('server is running...');
});

