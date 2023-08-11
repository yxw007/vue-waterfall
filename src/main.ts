import "../demo/common/css/style.css";
import { createApp } from "vue";
import App from "./App.vue";

const app = createApp(App);
app.mount("#app");

console.log(window);
