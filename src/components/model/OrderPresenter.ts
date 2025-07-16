import { FormOrder } from "../view/FormOrder";
import { OrderData } from "./OrderData";
import { IEvents } from "../base/Events";

export class OrderPresenter {
  protected view: FormOrder;
  protected model: OrderData;

  constructor(view: FormOrder, model: OrderData, events: IEvents) {
    this.view = view;
    this.model = model;

    // Слушаем событие input из формы
    events.on('order:input', (data: { field: string; value: string }) => {
      const { field, value } = data;

      // Запись в модель
      (this.model as any)[field] = value;

      // Валидация модели
      const errors = this.model.validate();

      // Передаём ошибки обратно в форму
      this.view.showErrors(errors);
    });
  }
}
