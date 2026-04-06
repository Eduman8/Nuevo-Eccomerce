import { useContext } from "react";
import { CartContext } from "../Context/cartContext";

export const useCart = () => useContext(CartContext);
