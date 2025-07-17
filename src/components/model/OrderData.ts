import { IOrderData, TPayment } from "../../types";

export class OrderData implements IOrderData {
  protected _payment: TPayment;
  protected _email: string;
  protected _phone: string;
  protected _address: string;

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

  get customerInfo() {
    return {
      payment: this._payment,
			email: this._email,
			phone: this._phone,
			address: this._address
    }
  }

  validate(): Record<string, string> {
  const errors: Record<string, string> = {};

  if (!this._address || this._address.trim() === '') {
    errors.address = 'Поле адреса обязательно';
  }

  if (!this._email || !this._email.includes('@')) {
    errors.email = 'Некорректный email';
  }

  if (!this._phone || this._phone.length < 10) {
    errors.phone = 'Некорректный номер телефона';
  }

  if (!this._payment) {
    errors.payment = 'Выберите способ оплаты';
  }

  return errors;
  }

  
}