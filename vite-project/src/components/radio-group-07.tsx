import React from "react";
import * as RadioGroup from "@radix-ui/react-radio-group";

const options = [
  {
    value: "4gb",
    label: "4GB + 64GB",
  },
  {
    value: "6gb",
    label: "6GB + 128GB",
  },
  {
    value: "8gb",
    label: "8GB + 128GB",
  },
];

const RadioCardsDemo = () => {
  return (
    <RadioGroup.Root
      defaultValue={options[0].value}
      className="max-w-sm w-full grid grid-cols-3 gap-3"
    >
      {options.map((option) => (
        <RadioGroup.Item
          key={option.value}
          value={option.value}
          className="ring-[1px] ring-border rounded py-1 px-3 data-[state=checked]:ring-2 data-[state=checked]:ring-blue-500"
        >
          <span className="font-semibold tracking-tight">{option.label}</span>
        </RadioGroup.Item>
      ))}
    </RadioGroup.Root>
  );
};

export default RadioCardsDemo;
