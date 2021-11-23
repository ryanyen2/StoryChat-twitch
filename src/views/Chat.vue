<template>
  <ion-page v-if="currentChannel">
    <ion-header :translucent="true">
      <ion-toolbar>
        <ion-title>{{ `${currentChannel.userDisplayName}'s chatroom` }}</ion-title>
        <ion-buttons slot="start">
          <ion-back-button color="primary" default-href="/"></ion-back-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="true">
      <ion-header collapse="condense">
        <ion-toolbar>
          <ion-title>{{ `${currentChannel.userDisplayName}'s chatroom` }}</ion-title>
        </ion-toolbar>
      </ion-header>

      <div
          id="container"
          style="max-height: 90%; padding-bottom: 55px; overflow-y: auto"
          ref="container"
      >
        <ion-list id="chat-list">
          <ion-item v-for="msg in messages" :key="msg.id" style="align-items: baseline">
            <ion-label>
              <span v-html="msg.message"></span>
            </ion-label>
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
import {ApiClient} from '@twurple/api';
import {useStore} from "@/store";

import { chatFilter } from '@/utils/chat-filter.ts'

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

      emotesList: [],

      // filter function
      filters: {
        profanityFilter: true,
        exEmotesFilter: 10,
      },

      containProfanity: false,
      containExEmotes: false
    };
  },
  methods: {
    sendMessage() {
      if (this.message.length > 0) {
        this.chatClient.say(this.currentChannel.userName, this.message);
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
    this.currentChannel = this.$route.params
    console.log(this.currentChannel)
    window.open(`https://www.twitch.tv/${this.currentChannel.userName}`, '_blank').focus()

    const authProvider = new StaticAuthProvider(
        this.clientId,
        this.accessToken
    );
    const apiClient = new ApiClient({authProvider})

    // const badges = await apiClient.chat.getChannelBadges(this.currentChannel)
    // console.log('BADGES: ', badges)

    const channelEmotesList = await apiClient.chat.getChannelEmotes(this.currentChannel.userId)
    const globalEmotesList = await apiClient.chat.getGlobalEmotes()
    this.emotesList = channelEmotesList.concat(globalEmotesList)

    this.chatClient = new ChatClient({authProvider, channels: [this.currentChannel.userName]});
    await this.chatClient.connect();

    this.followAgeListener = this.chatClient.onMessage(
        async (channel, user, message, msg) => {
          this.containExEmotes = false
          this.containProfanity = false

          const { profanityFilter, exEmotesFilter } = {...this.filters}
          if (profanityFilter) this.containProfanity = chatFilter.existsProfanity(message)

          if (exEmotesFilter > 0)  {
            let emoteCount = 0
            this.emotesList.map(emote => {
              const idx = message.indexOf(emote.name)
              if (!this.containExEmotes && idx !== -1 && emote.name !== ':/') {
                emoteCount += 1
                const emoteUrl = emote.getImageUrl(1)
                if (emoteCount < exEmotesFilter) {
                  message = message.replace(emote.name, `<img src="${emoteUrl}" alt="emote_${emote.id}" />`)
                } else this.containExEmotes = true
              }
            })
          }

          if (this.containExEmotes) console.log(`!!TOO MANY EMOTES!!\n${message}`)
          if(this.containProfanity) console.log(`!!PROFANITY MESSAGES!!\n${message}`)
          const colorMsg = msg.userInfo.color ? msg.userInfo.color : '#9147FF';

          this.messages.push({
            id: msg.id,
            user: user,
            message: `<p style="white-space: break-spaces"><span style="color: ${colorMsg}">${user}: </span>${message}</p>`,
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
