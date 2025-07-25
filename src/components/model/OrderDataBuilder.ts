import { Model } from "./Model";
import { IEvents } from "../base/Events";
import {
  IOrderDataBuilder,
  IOrderConstructor,
  IOrderData,
  TDeliveryInfo,
  TContactsInfo,
  TPayment
} from "../../types";

export class OrderDataBuilder extends Model implements IOrderDataBuilder {
  protected order: IOrderData;

  public errors: Record<string, string> = {};

  constructor(events: IEvents, orderConstructor: IOrderConstructor) {
    super(events);
    this.order = new orderConstructor();
  }

  set deliveryInfo(info: TDeliveryInfo) {
    this.order.payment = info.payment;
    this.order.address = info.address;
    this.validateDelivery();
  }

  set contactsInfo(info: TContactsInfo) {
    this.order.email = info.email;
    this.order.phone = info.phone;
    this.validateContacts();
  }

  getOrderData() {
    return this.order;
  }

  /** Валидация доставки (адрес и оплата) */
  validateDelivery() {
    const errors: Record<string, string> = {};

    if (!this.order.address?.trim()) {
      errors.address = 'Заполните поле адреса';
    }
    if (!this.order.payment) {
      errors.payment = 'Выберите способ оплаты';
    }

    const valid = Object.keys(errors).length === 0;
    this.errors = errors;

    // НИЧЕГО НЕ emit-им здесь!
    return { valid, errors };
  }


  /** Валидация контактов (email и телефон) */
  validateContacts(): { valid: boolean; errors: Record<string, string> } {
  const errors: Record<string, string> = {};

  if (!this.order.email?.trim()) {
    errors.email = 'Введите корректный email';
  }
  if (!this.order.phone) {
    errors.phone = 'Введите корректный номер телефона';
  }

  const valid = Object.keys(errors).length === 0;
  return { valid, errors };
}

  
    
  /** Общая валидация перед отправкой */
  validateAll(): boolean {
    const { valid: deliveryValid } = this.validateDelivery();
    const { valid: contactsValid } = this.validateContacts();
    return deliveryValid && contactsValid;
  }

  //обновление нужного поля в данных заказа
  updateField(fieldName: string, value: string) {
  switch(fieldName) {
    case 'payment':
      this.order.payment = value as TPayment;
      break;
    case 'address':
      this.order.address = value;
      break;
    case 'email':
      this.order.email = value;
      break;
    case 'phone':
      this.order.phone = value;
      break;
    default:
      console.warn(`Unknown field: ${fieldName}`);
  }
}

}
