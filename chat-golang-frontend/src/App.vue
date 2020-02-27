<template>

  <div :style="{ background: backgroundColor }">
    <beautiful-chat
      :alwaysScrollToBottom="alwaysScrollToBottom"
      :close="closeChat"
      :colors="colors"
      :isOpen="isChatOpen"
      :messageList="messageList"
      :messageStyling="messageStyling"
      :newMessagesCount="newMessagesCount"
      :onMessageWasSent="onMessageWasSent"
      :open="openChat"
      :participants="participants"
      :showEmoji="false"
      :showFile="false"
      :showTypingIndicator="showTypingIndicator"
      :titleImageUrl="titleImageUrl"
      :title="appTitle"
      :placeholder="inputTips"
      @onType="handleOnType"
      @edit="editMessage"
      @remove="removeMessage"
    >
      <template v-slot:text-message-toolbox="scopedProps">
        <button
          v-if="!scopedProps.me && scopedProps.message.type === 'text'"
          @click.prevent="like(scopedProps.message.id)"
        >
          👍
        </button>
      </template>
      <template v-slot:text-message-body="scopedProps">
        <p
          class="sc-message--text-content"
          v-html="scopedProps.messageText"
        ></p>
        <p
          v-if="scopedProps.message.data.meta"
          class="sc-message--meta"
          :style="{ color: scopedProps.messageColors.color }"
        >
          {{ scopedProps.message.data.meta }}
        </p>
        <p
          v-if="scopedProps.message.isEdited || scopedProps.message.liked"
          class="sc-message--edited"
        >
          <template v-if="scopedProps.message.isEdited"
            >✎</template>
          <template v-if="scopedProps.message.liked"
            >👍</template>
        </p>
      </template>
    </beautiful-chat>
  </div>
</template>

<script>
import Client from "./createWebSocket";
import messageHistory from "./messageHistory";
import chatParticipants from "./chatProfiles";
import availableColors from "./colors";

export default {
  name: "app",
  components: {},
  data() {
    return {
      chatToUser: "", // 单聊对象
      chatType: "single",
      isCheckin: false,
      username: "", //定义用户名
      participants: chatParticipants,
      titleImageUrl:
        "https://a.slack-edge.com/66f9/img/avatars-teams/ava_0001-34.png",
      appTitle: "即时聊天",
      inputTips: "随便聊点什么吧...",
      messageList: messageHistory,
      newMessagesCount: 0,
      isChatOpen: true,
      showTypingIndicator: "",
      colors: availableColors.blue,
      availableColors,
      chosenColor: null,
      alwaysScrollToBottom: true,
      messageStyling: true,
      userIsTyping: false
    };
  },
  created() {
    this.setColor("blue");
    window.addEventListener("beforeunload", e => this.beforeunloadHandler(e));
    window.addEventListener("unload", e => this.unloadHandler(e));
  },
  methods: {
    // usernameChange (val) {
    //   console.log('usernameChange', val)
    //   val = val + ''
    //   val = val.replace(/(^\s*)|(\s*$)/g, '')
    //   if(!val) {
    //       this.username = '';
    //       return
    //   }
    //   var reg = /[^\d.]/g

    //   // 只能是数字和小数点，不能是其他输入
    //   val = val.replace(reg, '')

    //   // 保证第一位只能是数字，不能是点
    //   val = val.replace(/^\./g, '')
    //   this.username = val
    // },
    // // 登录
    // login: function(e){
    //   if (this.username) {
    //     /*向服务端发送登录事件*/
    //     this.initWebSocket({
    //       host: 'ws:\/\/127.0.0.1:3102\/sub',
    //       chatType: this.chatType,
    //       username: this.username
    //     })
    //   } else {
    //     alert('请输入用户ID')
    //   }
    // },
    sendToMid: function(
      chatToUser,
      data,
      onlyToChatUser = false,
      useSync = false
    ) {
      console.log("sendToMid", chatToUser, data);
      let headers = {
        "Content-Type": "application/x-www-form-urlencoded"
      };
      if (onlyToChatUser) {
        var url =
          "http://127.0.0.1:3111/goim/push/mids?operation=1000&mids=" + chatToUser;
      } else {
        var url =
          "http://127.0.0.1:3111/goim/push/mids?operation=1000&mids=" +
          this.username +
          "&mids=" +
          chatToUser;
      }
      //发送消息
      console.log("url", url);
      let _datas = JSON.stringify({
        data: data,
        userid: this.username,
        chatType: "single"
      });
      if (useSync) {
        /* this.syncRequest(url, _datas); */
        // recommend way
        navigator.sendBeacon(url, _datas);
      } else {
        this.$http.post(url, _datas).then(
          function(res) {
            console.log(res.body);
          },
          function(res) {
            console.log(res.status);
          }
        );
      }
    },

    syncRequest: function(url, data) {
      var oAjax = new XMLHttpRequest();
      oAjax.open("POST", url, false); //false表示同步请求
      oAjax.setRequestHeader(
        "Content-type",
        "application/x-www-form-urlencoded"
      );
      oAjax.onreadystatechange = function() {};
      oAjax.send(data);
    },
    addChatHistory: function(data) {
      var oldItems = JSON.parse(sessionStorage.getItem("chatHistory")) || [];
      oldItems.push(data);
      sessionStorage.setItem("chatHistory", JSON.stringify(oldItems));
    },
    getCurrentDateTime: function() {
      let date = new Date();
      let y = date.getFullYear();
      let MM = date.getMonth() + 1;
      MM = MM < 10 ? "0" + MM : MM;
      let d = date.getDate();
      d = d < 10 ? "0" + d : d;
      let h = date.getHours();
      h = h < 10 ? "0" + h : h;
      let m = date.getMinutes();
      m = m < 10 ? "0" + m : m;
      let s = date.getSeconds();
      s = s < 10 ? "0" + s : s;
      return y + "-" + MM + "-" + d + " " + h + ":" + m + ":" + s;
    },
    sendToRoom: function(roomId, roomType, operation, data) {
      console.log("sendToRoom");
      var url =
        "http://127.0.0.1:3111/goim/push/room?operation=" +
        operation +
        "&type=" +
        roomType +
        "&room=" +
        roomId +
        "&mid=" +
        this.username;
      console.log("room url", url);
      let _datas = JSON.stringify({
        data: data,
        userid: this.username,
        chatType: "room"
      });
      console.log("_datas", _datas);
      this.$http.post(url, _datas).then(
        function(res) {
          console.log(res.body);
        },
        function(res) {
          console.log(res.status);
        }
      );
    },
    initWebSocket(options) {
      //初始化weosocket
      console.log("initWebSocket", options);
      let self = this;
      this.myClient = Client({
        ...options,
        appendMsg: function(datas) {
          let _datas = JSON.parse(datas);
          console.log("appendMsg _datas", _datas);
          var chatToUser = sessionStorage.getItem("chatToUser");

          if (chatToUser) {
            self.chatToUser = sessionStorage.getItem("chatToUser");
          } else if (
            self.chatType === "single" &&
            _datas.userid !== this.username
          ) {
            self.chatToUser = _datas.userid;
            sessionStorage.setItem("chatToUser", _datas.userid);
          }

          self.showMessage({
            author: self.username === _datas.userid ? "me" : _datas.userid,
            type: "text",
            id: Math.random(),
            data: { text: _datas.data }
          });
        }
      });
      this.isCheckin = true;
      sessionStorage.setItem("hasLogin", 1);
      var currentDateWithFormat = this.getCurrentDateTime();
      if (options.needRelogin) {
        this.showMessage({
          type: "system",
          id: 20,
          data: {
            text: "你好：" + this.username + ", 已重新为您连上",
            meta: currentDateWithFormat
          }
        });
        this.sendToMid(this.chatToUser, "system::对方已重新连上", 1);
      } else if (this.chatType === "single") {
        this.showMessage({
          type: "system",
          id: 20,
          data: {
            text: "你好：" + this.username + ", 正在自动匹配用户...",
            meta: currentDateWithFormat
          }
        });
      } else {
        this.showMessage({
          type: "system",
          id: 20,
          data: {
            text: "你好：" + this.username + ", 欢迎加入群聊!~",
            meta: currentDateWithFormat
          }
        });
      }
    },
    sendMessage(text) {
      if (text.length > 0) {
        this.newMessagesCount = this.isChatOpen
          ? this.newMessagesCount
          : this.newMessagesCount + 1;
        this.onMessageWasSent({
          author: "support",
          type: "text",
          id: Math.random(),
          data: { text }
        });
      }
    },
    handleTyping(text) {
      this.showTypingIndicator =
        text.length > 0
          ? this.participants[this.participants.length - 1].id
          : "";
    },
    onMessageWasSent(message) {
      console.log("onMessageWasSent", message);
      //this.showMessage(message)
      //this.sendToMid(123,message.data.text)
      console.log("onMessageWasSent this.chatToUser", this.otherUsername);
      this.chatType === "single"
        ? this.sendToMid(this.chatToUser, message.data.text)
        : this.sendToRoom(1000, "live", 1000, message.data.text);
    },
    showMessage(message) {
      console.log("showMessage", message);
      if (
        message.data.text === "system::对方断线" ||
        message.data.text === "system::对方退出" ||
        message.data.text === "system::对方已重新连上"
      ) {
        message.type = "system";
        message.data.text = message.data.text.substring(8);
      }
      this.messageList = [
        ...this.messageList,
        Object.assign({}, message, { id: Math.random() })
      ];
      this.addChatHistory(message);
    },
    openChat() {
      this.isChatOpen = true;
      this.newMessagesCount = 0;
    },
    closeChat() {
      this.isChatOpen = false;
    },
    setColor(color) {
      this.colors = this.availableColors[color];
      this.chosenColor = color;
    },
    showStylingInfo() {
      this.$modal.show("dialog", {
        title: "Info",
        text:
          "You can use *word* to <strong>boldify</strong>, /word/ to <em>emphasize</em>, _word_ to <u>underline</u>, `code` to <code>write = code;</code>, ~this~ to <del>delete</del> and ^sup^ or ¡sub¡ to write <sup>sup</sup> and <sub>sub</sub>"
      });
    },
    messageStylingToggled(e) {
      this.messageStyling = e.target.checked;
    },
    handleOnType() {
      this.$root.$emit("onType");
      this.userIsTyping = true;
    },
    editMessage(message) {
      const m = this.messageList.find(m => m.id === message.id);
      m.isEdited = true;
      m.data.text = message.data.text;
    },
    removeMessage(message) {
      if (confirm("Delete?")) {
        const m = this.messageList.find(m => m.id === message.id);
        m.type = "system";
        m.data.text = "This message has been removed";
      }
    },
    like(id) {
      const m = this.messageList.findIndex(m => m.id === id);
      var msg = this.messageList[m];
      msg.liked = !msg.liked;
      this.$set(this.messageList, m, msg);
    },
    confirmQuitOrRefresh: function(event) {
      console.log("confirmQuitOrRefresh", event);
      sessionStorage.setItem("hasRefreshPage", 1);
      this.sendToMid(this.chatToUser, "system::对方断线", 1, 1);
    },
    beforeunloadHandler(event) {
      /* event.preventDefault(); */
      /* /1* event.returnValue = ""; *1/ */
      /* var confirmationMessage = "\o/"; */
      /* (event || window.event).returnValue = confirmationMessage; // Gecko and Trident */
      /* return confirmationMessage; // Gecko and WebKit */
    },
    unloadHandler(event) {
      event.preventDefault();
      /* event.returnValue = ""; */
      var confirmationMessage = "\o/";
      (event || window.event).returnValue = confirmationMessage; // Gecko and Trident
      this.confirmQuitOrRefresh(event);
    }
  },
  computed: {
    linkColor() {
      return this.chosenColor === "dark"
        ? this.colors.sentMessage.text
        : this.colors.launcher.bg;
    },
    backgroundColor() {
      return this.chosenColor === "dark" ? this.colors.messageList.bg : "#fff";
    }
  },
  mounted() {
    var hasLogin = sessionStorage.getItem("hasLogin");
    var hasRefreshPage = sessionStorage.getItem("hasRefreshPage");
    var chatToUser = sessionStorage.getItem("chatToUser");
    var chatFromUser = sessionStorage.getItem("chatFromUser");
    console.log("hasLogin", hasLogin);
    console.log("chatFromUser", chatFromUser);
    console.log("chatToUser", chatToUser);
    console.log("hasRefreshPage", hasRefreshPage);

    if (!hasLogin) {
      this.username = +(+new Date() + "" + Math.floor(Math.random() * 1000));
      sessionStorage.setItem("chatFromUser", this.username);
    } else {
      this.username = chatFromUser;
    }

    if (chatToUser) {
      this.chatToUser = chatToUser;
    }

    this.needRelogin = hasLogin && hasRefreshPage && chatToUser;

    this.messageList.forEach(x => (x.liked = false));

    // this.username = uuidv4()
    if (this.username) {
      /*向服务端发送登录事件*/
      this.initWebSocket({
        host: "ws:\/\/127.0.0.1:3102\/sub",
        chatType: this.chatType,
        username: this.username,
        needRelogin: this.needRelogin
      });
    }
  },
  beforeDestroy() {
    console.log("beforeDestroy");
  }
};
</script>

<style>
body {
  padding: 0px;
  margin: 0px;
}

* {
  font-family: Avenir Next, Helvetica Neue, Helvetica, sans-serif;
}

/*登录界面*/
.login-wrap {
  width: 100%;
  height: 100%;
  text-align: center;
}
.login-con {
  padding-top: 50px;
}
.login-con h3 {
  margin-bottom: 20px;
}
.login-con .input {
  width: 60%;
  display: block;
  margin: 0 auto;
  height: 40px;
  line-height: 40px;
  margin-bottom: 20px;
}
.login-con button {
  width: 60%;
  display: block;
  margin: 0 auto;
  height: 40px;
  line-height: 40px;
  border: none;
  background: #459d36;
  color: #fff;
  border-radius: 5px;
}
.radio-group {
  padding: 20px 0;
  width: 60%;
  margin: 0 auto;
  display: flex;
  flex-direction: row;
}

.demo-description {
  max-width: 500px;
}

.demo-description img {
  max-width: 500px;
}

.demo-test-area {
  width: 300px;
  box-sizing: border-box;
}

.demo-test-area--text {
  box-sizing: border-box;
  width: 100%;
  margin: 0px;
  padding: 0px;
  resize: none;
  font-family: Avenir Next, Helvetica Neue, Helvetica, sans-serif;
  background: #fafbfc;
  color: #8da2b5;
  border: 1px solid #dde5ed;
  font-size: 16px;
  padding: 16px 15px 14px;
  margin: 0;
  border-radius: 6px;
  outline: none;
  height: 150px;
  margin-bottom: 10px;
}

.demo-monster-img {
  width: 400px;
  display: block;
  margin: 60px auto;
}

.text-center {
  text-align: center;
}

.colors a {
  color: #fff;
  text-decoration: none;
  padding: 4px 10px;
  border-radius: 10px;
}

.toggle a {
  text-decoration: none;
}

.messageStyling {
  font-size: small;
}
</style>
