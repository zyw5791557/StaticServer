var express = require('express');
var app = express();
var multer = require('multer');
var upload = multer();

// 文件处理模块
var fs = require('fs');

// 上传文件配置地址
var config = require('./config/config.js');
var AvatarPath_BASE = __dirname + config.AvatarPath;

var allowCrossDomain = function(req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
    res.header("Access-Control-Allow-Headers", "X-Requested-With");
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    res.header('Access-Control-Allow-Credentials','true');
    next();
};
app.use(allowCrossDomain);

app.use("/", express.static(__dirname + "/assets"));

app.post('/api/avatar_upload', upload.single('avatar'), function(req,res,next) {
	// 设置编码格式
	req.header('Content-Type', 'charset=utf-8');
	if(req.file) {
		// 谁上传的  req.body.avatarName
		var name = req.body.avatarName;
		// 存哪里, 取什么名字。
		var fileFormat = req.file.originalname.split('.');
		var avatarName = AvatarPath_BASE + name + '.' + fileFormat[fileFormat.length - 1];
		// 写入磁盘
		fs.writeFile(avatarName, req.file.buffer, function(err) {
			if(err) {
				res.send({ Code: -1, Str: '文件上传失败！' });
			} else {
				res.send({ Code: 0, Str: '文件上传成功！' });
			}
		});
	}
});

app.listen(8989);