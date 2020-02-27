const rawHeaderLen = 16;
const packetOffset = 0;
const headerOffset = 4;
const verOffset = 6;
const opOffset = 8;
const seqOffset = 12;

var Client = function(options) {
  console.log("=====Client=options===", options);
  var MAX_CONNECT_TIMES = 10;
  var DELAY = 15000;
  createConnect(MAX_CONNECT_TIMES, DELAY, options);
};

var appendMsg = function(text, options) {
  var that = self;
  options && options.appendMsg && options.appendMsg(text);
};

var createConnect = function(max, delay, options) {
  var that = self;
  if (max === 0) {
    return;
  }
  connect(options);

  var textDecoder = new TextDecoder();
  var textEncoder = new TextEncoder();
  var heartbeatInterval;
  function connect(options) {
    let host = options && options.host;
    if (!host) {
      return;
    }
    var ws = new WebSocket(host);
    ws.binaryType = "arraybuffer";
    ws.onopen = function() {
      console.log("open", options);
      auth(options);
    };

    ws.onmessage = function(evt) {
      console.log("onmessage", evt);
      var data = evt.data;
      var dataView = new DataView(data, 0);
      var packetLen = dataView.getInt32(packetOffset);
      var headerLen = dataView.getInt16(headerOffset);
      var ver = dataView.getInt16(verOffset);
      var op = dataView.getInt32(opOffset);
      var seq = dataView.getInt32(seqOffset);

      console.log(
        "receiveHeader: packetLen=" + packetLen,
        "headerLen=" + headerLen,
        "ver=" + ver,
        "op=" + op,
        "seq=" + seq
      );

      switch (op) {
        case 8:
          // auth reply ok
          console.log("status ok");
          //document.getElementById("status").innerHTML = "<color style='color:green'>ok<color>";
          //appendMsg("receive: auth reply");
          // send a heartbeat to server
          heartbeat();
          heartbeatInterval = setInterval(heartbeat, 30 * 1000);
          break;
        case 3:
          // receive a heartbeat from server
          console.log("receive: heartbeat");
          //appendMsg("eeceive: heartbeat reply");
          break;
        case 9:
          // batch message
          for (
            var offset = rawHeaderLen;
            offset < data.byteLength;
            offset += packetLen
          ) {
            // parse
            var packetLen = dataView.getInt32(offset);
            var headerLen = dataView.getInt16(offset + headerOffset);
            var ver = dataView.getInt16(offset + verOffset);
            var op = dataView.getInt32(offset + opOffset);
            var seq = dataView.getInt32(offset + seqOffset);
            var msgBody = textDecoder.decode(
              data.slice(offset + headerLen, offset + packetLen)
            );
            console.log("========batch message msgBody", msgBody);
            // callback
            messageReceived(ver, msgBody);
            //appendMsg("receive: ver=" + ver + " op=" + op + " seq=" + seq + " message=" + msgBody);
            appendMsg(msgBody, options);
          }
          break;
        default:
          var msgBody = textDecoder.decode(data.slice(headerLen, packetLen));
          messageReceived(ver, msgBody);
          //appendMsg("receive: ver=" + ver + " op=" + op + " seq=" + seq + " message=" + msgBody);
          appendMsg(msgBody, options);
          console.log("=======message msgBody", msgBody);
          break;
      }
    };

    ws.onclose = function() {
      if (heartbeatInterval) clearInterval(heartbeatInterval);
      setTimeout(reConnect, delay);
      // appendMsg({ type: 'system', id: 20, data: { text: '对方已退出', meta: '04-08-2018 15:57' } })

      // document.getElementById("status").innerHTML =  "<color style='color:red'>failed<color>";
    };

    ws.addEventListener("close", function(event) {
      alert("close");
      ws.onclose();
    });

    function heartbeat() {
      var headerBuf = new ArrayBuffer(rawHeaderLen);
      var headerView = new DataView(headerBuf, 0);
      headerView.setInt32(packetOffset, rawHeaderLen);
      headerView.setInt16(headerOffset, rawHeaderLen);
      headerView.setInt16(verOffset, 1);
      headerView.setInt32(opOffset, 2);
      headerView.setInt32(seqOffset, 1);
      ws.send(headerBuf);
      console.log("send: heartbeat");
      //appendMsg("send: heartbeat");
    }

    function auth(options) {
      console.log("auth====options======", options);
      let { chatType, needRelogin } = options;
      console.log("auth chattype======", chatType, needRelogin);
      if (needRelogin) {
        var token = `{"mid":${
          options.username
        }, "room_id":"relogin://1001", "platform":"web", "accepts":[1000,1001,1002]}`;
      } else {
        var token =
          chatType === "room"
            ? `{"mid":${
                options.username
              }, "room_id":"live://1000", "platform":"web", "accepts":[1000,1001,1002]}`
            : `{"mid":${
                options.username
              }, "room_id":"match://1001", "platform":"web", "accepts":[1000,1001,1002]}`;
      }
      let headerBuf = new ArrayBuffer(rawHeaderLen);
      let headerView = new DataView(headerBuf, 0);
      let bodyBuf = textEncoder.encode(token);
      headerView.setInt32(packetOffset, rawHeaderLen + bodyBuf.byteLength);
      headerView.setInt16(headerOffset, rawHeaderLen);
      headerView.setInt16(verOffset, 1);
      headerView.setInt32(opOffset, 7);
      headerView.setInt32(seqOffset, 1);
      ws.send(mergeArrayBuffer(headerBuf, bodyBuf));

      console.log("auth token===", token);
      appendMsg("send: auth token: " + token);
    }

    function messageReceived(ver, body) {
      //var notify = that.options.notify;
      //if(notify) notify(body);
      console.log("messageReceived:", "ver=" + ver, "body=" + body);
    }

    function mergeArrayBuffer(ab1, ab2) {
      var u81 = new Uint8Array(ab1),
        u82 = new Uint8Array(ab2),
        res = new Uint8Array(ab1.byteLength + ab2.byteLength);
      res.set(u81, 0);
      res.set(u82, ab1.byteLength);
      return res.buffer;
    }

    function char2ab(str) {
      var buf = new ArrayBuffer(str.length);
      var bufView = new Uint8Array(buf);
      for (var i = 0; i < str.length; i++) {
        bufView[i] = str[i];
      }
      return buf;
    }
  }

  function reConnect() {
    createConnect(--max, delay * 2);
  }
};

//   self['MyClient'] = Client();

export default Client;
