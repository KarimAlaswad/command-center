import { Electroview } from "electrobun/view";
const rpc = Electroview.defineRPC({
  handlers: {
    messages: {},
  },
});
new Electroview({ rpc });
export default rpc;
