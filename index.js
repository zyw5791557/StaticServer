var express = require('express');
var app = express();
var multer = require('multer');
var upload = multer();

// 文件处理模块
var fs = require('fs');

// 数据库模块
var mongoose = require('mongoose');
	require('./server/connect.js');
	require('./server/model.js');

// 获取 users 集合并指向 Messages 
var Users = mongoose.model('users');
mongoose.Promise = global.Promise;


// 上传文件配置地址
var config = require('./config/config.js');
var AvatarPath_BASE = __dirname + config.AvatarPath;
var MessageImgPath_BASE = __dirname + config.MessageImgPath;

// 静态资源服务器地址配置
var STATIC_SERVER = config.STATIC_SERVER;

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

// 头像上传
app.post('/api/avatar_upload', upload.single('avatar'), function(req,res,next) {
	// 设置编码格式
	req.header('Content-Type', 'charset=utf-8');
	if(req.file) {
		// 谁上传的  req.body.avatarName
		var name = req.body.avatarName;
		// 存哪里, 取什么名字。
		var fileFormat = req.file.originalname.split('.');
		// 远程访问地址
		var remoteAvatar = STATIC_SERVER + '/images/users/' + name + '.' + fileFormat[fileFormat.length - 1];
		var avatarName = AvatarPath_BASE + name + '.' + fileFormat[fileFormat.length - 1];
		// 写入磁盘
		fs.writeFile(avatarName, req.file.buffer, function(err) {
			if(err) {
				res.send({ Code: -1, Str: '文件上传失败！' });
			} else {
				// 要查询的用户
				var query = { name: name };
				// 如何更新修改
				var newVal = { $set: { avatar: remoteAvatar } };
				// 数据库更新
				Users.update(query, newVal, function(err,result) {
					if(err) {
						console.log('头像更新失败！');
					} else {
						console.log('头像更新成功！');
					}
				});
				res.send({ Code: 0, Str: '文件上传成功！', Avatar: remoteAvatar });
			}
		});
	}
});

// 截图上传
app.post('/api/ps_upload', upload.single('ps'), function(req,res,next) {
	// 设置编码格式
	req.header('Content-Type', 'charset=utf-8');
	if(req.file) {
		// 谁上传的  req.body.avatarName
		var name = req.body.avatarName;
		// 获取时间戳
		var date = Date.now();
		// 存哪里, 取什么名字。
		var fileFormat = req.file.originalname.split('.');
		// 远程访问地址
		var remoteAvatar = STATIC_SERVER + '/images/printscreen/' + 'message_' + date + '.' + fileFormat[fileFormat.length - 1];
		var avatarName = MessageImgPath_BASE + 'message_' + date + '.' + fileFormat[fileFormat.length - 1];
		// 写入磁盘
		fs.writeFile(avatarName, req.file.buffer, function(err) {
			if(err) {
				res.send({ Code: -1, Str: '文件上传失败！' });
			} else {
				res.send({ Code: 0, Str: '文件上传成功！', ps: remoteAvatar });
			}
		});
	}
});

app.listen(8989);