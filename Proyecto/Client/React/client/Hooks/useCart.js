import { useContext } from "react";
import { CartContext } from "../Context/CartContext";

export const useCart = () => useContext(CartContext);
