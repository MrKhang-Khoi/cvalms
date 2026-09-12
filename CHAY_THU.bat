@echo off
title LMS Phong May 18 May - May Ban So 4
echo ================================================================
echo   DANG KHOI DONG HE THONG LMS PHONG MAY (MAY BAN SO 4)
echo ================================================================
echo.
echo May chu mini dang chay tai: http://localhost:8080/index.html?set_machine=4
echo Trinh duyet se tu dong mo ngay bay gio...
echo (De dung may chu, hay dong cua so nay)
echo.
start "" "http://localhost:8080/index.html?set_machine=4"
node -e "const http=require('http'),fs=require('fs'),path=require('path');const m={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'application/javascript; charset=utf-8','.json':'application/json; charset=utf-8','.png':'image/png'};http.createServer((q,s)=>{let p=q.url.split('?')[0];if(p==='/')p='/index.html';let f=path.join(__dirname,p);if(fs.existsSync(f)){s.writeHead(200,{'Content-Type':m[path.extname(f)]||'text/plain','Access-Control-Allow-Origin':'*'});fs.createReadStream(f).pipe(s);}else{s.writeHead(404);s.end('Not Found');}}).listen(8080);"
