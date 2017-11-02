var express = require('express');
var app = express();
var multer = require('multer');
var upload = multer();

// 文件处理模块
var fs = require('fs');

// 子进程
var child = require('child_process');

// 数据库模块
var mongoose = require('mongoose');
	require('./server/connect.js');
	require('./server/model.js');

// 获取 users 集合并指向 users 
var Users = mongoose.model('users');
// 获取 messages 集合并指向 Messages 
var Messages = mongoose.model('messages');
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
		// 设置头像的时间。
		var date = Date.now();
		// 远程访问地址
		var remoteAvatar = STATIC_SERVER + '/images/users/' + name + '.' + fileFormat[fileFormat.length - 1] + '?' + date;
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
                        // 更新数据库 Messages 表下改用户的头像信息
                        Messages.updateMany({from: name}, { $set: { avatar: remoteAvatar } }, {}, function(err, rres) {
                            if(err) throw err;
                            console.log(`${name}用户消息修改结果：`,rres);
                        });
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


// 清空截图和消息表
app.post('/api/clearData', function(req,res) {
	var str = '';
	req.on('data', function(chunk) {
		str += chunk;
	});
	req.on('end', function() {
		var data = JSON.parse(str);
		var user = data.user;
		if(user === 'Emlice') {
			// 删除 Messages 表数据
			Messages.deleteMany({},function(err,handleResult) {
				if(err) {
					res.send({ Code: -1, Str: '数据删除失败！' });
					throw err;
				}
				console.log('数据库删除成功,删除信息：', handleResult);
				// 删除截图数据
				child.exec('rm -rf assets/images/printscreen/*',function(err,out) {
					if(err) {
						res.send({ Code: -1, Str: '数据删除失败！' });
						throw err;
					}
					console.log('截图数据删除成功,删除信息：',out); 
					res.send({ Code: 0, Str: '数据删除成功！' });
				});
			});
		} else {
			res.send({ Code: -2, Str: '您没有该权限！' });
		}
	});
	
});

app.listen(8989);