import { IOrderData, TPayment } from "../../types";

export class OrderData implements IOrderData {
  protected _payment: TPayment;
  protected _email: string;
  protected _phone: string;
  protected _address: string;
  protected _total: number;
  protected _items: string[];

  constructor() {

  }

  set payment(value: TPayment) {
    this._payment = value
  }
  
  set email(value: string) {
    this._email = value
  }

  set phone(value: string) {
    this._phone = value
  }

  set address(value: string) {
    this._address = value
  }

  set total(value: number) {
    this._total = value
  }

  set items(value: string[]) {
    this._items = value
  }

  get customerInfo() {
    return {
      payment: this._payment,
			email: this._email,
			phone: this._phone,
			address: this._address,
			total: this._total,
			items: this._items
    }
  }

  validate() {
    const errors: Record<string, string> = {};

    if (!this._email || !this._email.includes('@')) {
      errors.email = 'Email должен содержать @';
    }

    if (!this._phone || this._phone.length < 5) {
      errors.phone = 'Телефон введён некорректно';
    }

    if (!this._address) {
      errors.address = 'Адрес обязателен';
    }

    if (!['cash', 'card', 'online'].includes(this._payment)) {
      errors.payment = 'Выберите способ оплаты';
    }

    return errors;
  }
}