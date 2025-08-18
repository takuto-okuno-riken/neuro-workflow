import { IconType } from "react-icons";
import { FiDatabase } from "react-icons/fi";

interface NodeType {
  id: string;
  type: string;
  label: string;
  icon: IconType;
  description: string;
  category: string;
}

export const nodeTemplates: NodeType[] = [
  {
    id: "input-node",
    type: "input",
    label: "TestClass1",
    icon: FiDatabase,
    description: "args:{int, str}",
    category: "Input/Output",
  },
  {
    id: "input-node",
    type: "input",
    label: "TestClass2",
    icon: FiDatabase,
    description: "args:{int, str}",
    category: "Input/Output",
  },
  {
    id: "input-node-2",
    type: "input",
    label: "TestClass3",
    icon: FiDatabase,
    description: "args:{int, str}",
    category: "Input/Output",
  },
  {
    id: "input-node-3",
    type: "input",
    label: "TestClass4",
    icon: FiDatabase,
    description: "args:{int, str}",
    category: "Input/Output",
  },
];
