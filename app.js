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
  origin: ['http://localhost:8080', 'http://127.0.0.1:8080']
}));

app.get('/newsall', (req, res) => {
  let sql = 'SELECT * FROM hot_info where hi_type="热门"';
  // 执行SQL语句
  pool.query(sql, (error, results) => {
    if (error) throw error;
    res.send({ message: 'ok', code: 200, results: results });
  });
});
app.get('/detail', (req, res) => {
  let id = req.query.id;
  console.log(id);
  let sql = 'SELECT * FROM hot_info where hi_type="热门" and hi_id=?';
  // 执行SQL语句
  pool.query(sql, [id],(error, results) => {
    if (error) throw error;
    res.send({ message: 'ok', code: 200, results: results });
  });
});

// 指定服务器对象监听的端口号
app.listen(3000, () => {
  console.log('server is running...');
});