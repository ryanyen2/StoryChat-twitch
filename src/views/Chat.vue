<template>
  <ion-page>
    <ion-header :translucent="true">
      <ion-toolbar>
        <ion-title>{{ `${currentChannel}'s chatroom` }}</ion-title>
        <ion-buttons slot="start">
          <ion-back-button color="primary" default-href="/"></ion-back-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="true">
      <ion-header collapse="condense">
        <ion-toolbar>
          <ion-title>{{ `${currentChannel}'s chatroom` }}</ion-title>
        </ion-toolbar>
      </ion-header>

      <div
          id="container"
          style="max-height: 90%; padding-bottom: 55px; overflow-y: auto"
          ref="container"
      >
        <ion-list id="chat-list">
          <ion-item v-for="msg in messages" :key="msg.id">
            <span :style="{ color: msg.color ? msg.color : '#9147FF' }">{{
                msg.user
              }}</span>
            <ion-label>: {{ msg.message }}</ion-label>
          </ion-item>
        </ion-list>
      </div>
    </ion-content>

    <ion-footer class="ion-no-border" style="padding: 5px">
      <ion-toolbar>
        <ion-item>
          <ion-input
              @keyup.enter="sendMessage"
              clear-input
              type="text"
              placeholder="Send a message"
              v-model="message"
          ></ion-input>
          <ion-button shape="round" size="small" fill="clear" color="medium">
            <ion-icon slot="icon-only" :icon="happyOutline"></ion-icon>
          </ion-button>
          <ion-button
              shape="round"
              size="small"
              fill="clear"
              @click.end="sendMessage"
          >
            <ion-icon slot="icon-only" :icon="sendOutline"></ion-icon>
          </ion-button>
        </ion-item>
      </ion-toolbar>
    </ion-footer>
  </ion-page>
</template>

<script>
import {
  IonButtons,
  IonContent,
  IonFooter,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  IonInput,
  IonItem,
  IonIcon,
  IonLabel,
  IonList,
  IonButton,
  IonBackButton,
} from "@ionic/vue";
import {happyOutline, sendOutline} from "ionicons/icons";

import {StaticAuthProvider} from "@twurple/auth";
import {ChatClient} from "@twurple/chat";
import {useStore} from "@/store";

export default {
  name: "Folder",
  components: {
    IonButtons,
    IonContent,
    IonHeader,
    IonPage,
    IonTitle,
    IonToolbar,
    IonFooter,
    IonInput,
    IonItem,
    IonIcon,
    IonLabel,
    IonList,
    IonButton,
    IonBackButton
  },
  data() {
    return {
      message: "",
      messages: [],
      chatClient: null,
      currentChannel: null,
      followAgeListener: null,
      accessToken: "",
      currentUser: {},
    };
  },
  methods: {
    sendMessage() {
      if (this.message.length > 0) {
        console.log(this.message);
        this.chatClient.say(this.currentChannel, this.message);
        this.messages.push({
          id: this.uuidv4(),
          user: this.currentUser.displayName,
          message: this.message,
          color: "#ff9900",
        });
        this.message = "";
      }
    },
    uuidv4() {
      return ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, c => (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16));
    }
  },
  setup() {
    return {
      sendOutline,
      happyOutline,
      clientId: process.env.VUE_APP_CLIENT_ID,
    };
  },
  async mounted() {
    const store = useStore();
    this.accessToken = store.state.token
    this.currentUser = store.state.currentUser
    this.currentChannel = this.$route.params.channel
    window.open(`https://www.twitch.tv/${this.currentChannel}`, '_blank').focus()

    console.log(this.accessToken, this.currentUser)

    const authProvider = new StaticAuthProvider(
        this.clientId,
        this.accessToken
    );
    this.chatClient = new ChatClient({authProvider, channels: [this.currentChannel]});
    await this.chatClient.connect();

    this.followAgeListener = this.chatClient.onMessage(
        async (channel, user, message, msg) => {
          // this.currentChannel = channel;
          // console.log(user, msg);
          this.messages.push({
            id: msg.id,
            user: user,
            color: msg.userInfo.color,
            message: message,
          });
          const container = this.$el.querySelector("#container");
          container.scrollTop = container.scrollHeight;
        }
    );
  },
  beforeUnmount() {
    this.chatClient.removeListener(this.followAgeListener);
  },
};
</script>

<style scoped>
#container {
  text-align: center;
  position: absolute;
  left: 0;
  right: 0;
  top: 50%;
  transform: translateY(-50%);
}

#container strong {
  font-size: 20px;
  line-height: 26px;
}

#container p {
  font-size: 16px;
  line-height: 22px;
  color: #8c8c8c;
  margin: 0;
}

#container a {
  text-decoration: none;
}
</style>
