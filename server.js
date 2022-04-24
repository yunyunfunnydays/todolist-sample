const http = require('http');
const { v4: uuidv4 } = require('uuid');
const errorHandle = require('./errorHandle');
const errHandle = require('./errorHandle');

const todos = [];
const requestListener = (req, res) => {
  const headers = {
    // 同意接收的表頭內容
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, Content-Length, X-Requested-With',
    // 同意傳送請求的網域
    'Access-Control-Allow-Origin': '*',
    // 可以接受的操作
    'Access-Control-Allow-Methods': 'PATCH, POST, GET,OPTIONS,DELETE',
    // 傳送的 body 的格式
    'Content-Type': 'application/json',
  };
  let body = '';

  // Post的內容分割成的封包組起來
  req.on('data', (chunk) => {
    body += chunk;
  });
  if (req.url === '/todos' && req.method === 'GET') {
    res.writeHead(200, headers);
    res.write(JSON.stringify({
      status: 'success',
      data: todos,
    }));
    res.end();
  } else if (req.url === '/todos' && req.method === 'POST') {
    // 封包組完後執行
    req.on('end', () => {
      try {
        // 將取得的資料作此處理，確認傳送來的內容有符合我們要的格式
        const { title } = JSON.parse(body);
        if (title !== undefined) {
          const todo = {
            title,
            id: uuidv4(),
          };
          todos.push(todo);
          // 回傳一個JSON格式的物件(要轉換為string型態才能傳輸)
          res.writeHead(200, headers);
          res.write(JSON.stringify({
            status: 'success',
            data: todos,
          }));
          res.end();
        } else {
          errHandle(res);
        }
      } catch (err) {
        errHandle(res);
      }
    });
  } else if (req.url === '/todos' && req.method === 'DELETE') {
    // 刪除所有待辦
    // delete功能不用監聽body(chunk)傳完沒，只要收到刪除請求會立即執行
    todos.length = 0;// 將todos陣列清空
    res.writeHead(200, headers);
    res.write(JSON.stringify({
      status: 'success',
      data: todos,
    }));
    res.end();
  } else if (req.url.startsWith('/todos/') && req.method === 'DELETE') {
    // startsWith 是 string 的方法，前面為此 /todos「/」 url 者，為要刪除單筆的起手式

    // 確認原先資料中有沒有欲刪除的id
    const id = req.url.split('/').pop();
    // 以/分割成陣列，pop出最後一個值
    const index = todos.findIndex((element) => element.id === id);
    // index若為-1代表無此值
    if (index !== -1) {
      todos.splice(index, 1);
      res.writeHead(200, headers);
      res.write(JSON.stringify({
        status: 'success',
        data: todos,
      }));
      res.end();
    } else {
      errorHandle(res);
    }
  } else if (req.url.startsWith('/todos/') && req.method === 'PATCH') {
    // *因為有傳資料來所以要設定在傳完資料後啟動
    req.on('end', () => {
      try {
        // *確認資料格式正確
        const { title } = JSON.parse(body);
        // *確認有此id
        const id = req.url.split('/').pop();
        const index = todos.findIndex((element) => element.id === id);
        // *資料格式正確且有此id，根據id寫入新的資料
        if (title !== undefined && index !== -1) {
          todos[index].title = title;
          res.writeHead(200, headers);
          res.write(JSON.stringify({
            status: 'success',
            data: todos,
          }));
          res.end();
        } else {
          errorHandle(res);
        }
      } catch (err) {
        errorHandle(res);
      }
    });
  } else if (req.method === 'OPTIONS') {
    // 回應CORS（跨網域資料傳輸）的preflight請求，確認是否可傳輸訊息
    res.writeHead(200, headers);
    res.end();
  } else {
    res.writeHead(404, headers);
    res.write(JSON.stringify({
      status: 'false',
      message: '無此網站路由',
    }));
    res.end();
  }
};
const server = http.createServer(requestListener);
//* 部署到 HEROKU： HEROKU 是用此環境變數 process.env.PORT 作為端口，本地端無此環境變數所以還是用 3005
server.listen(process.env.PORT || 3005);
