import { FormOrder } from "../view/FormOrder";
import { OrderData } from "./OrderData";
import { IEvents } from "../base/Events";

export class OrderPresenter {
  constructor(
    protected view: FormOrder,
    protected model: OrderData,
    protected events: IEvents
  ) {
    // Реакция на ввод пользователя
    this.events.on("order:input", (data: { field: string; value: string }) => {
      (this.model as any)[data.field] = data.value;

      const errors = this.model.validate();

      this.view.setErrors(errors);

      this.events.emit("order:valid", {
        isValid: Object.keys(errors).length === 0,
      });
    });
  }
}
