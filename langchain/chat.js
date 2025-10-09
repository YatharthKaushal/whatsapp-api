import { HumanMessage, SystemMessage } from "@langchain/core/messages";

import model from "./llm.js";

const messages = [
  new SystemMessage("Translate the following from English into Italian"),
  new HumanMessage("hi!"),
];

const test = async () => {
  console.log("> test exec");
  const response = await model.invoke(messages);
  console.log(response);
};
export default test;
