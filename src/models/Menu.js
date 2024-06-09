// models/Menu.js
import mongoose from 'mongoose';

const menuItemSchema = new mongoose.Schema({
  item: String,
  price: Number,
});

const menuSchema = new mongoose.Schema({
  url: String,
  menuItems: [menuItemSchema],
});

const Menu = mongoose.model('Menu', menuSchema);

export default Menu;
