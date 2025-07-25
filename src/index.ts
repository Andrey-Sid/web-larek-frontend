// импортируем ресурсы
import './scss/styles.scss';
import { API_URL, CDN_URL } from './utils/constants';
import { EventEmitter } from "./components/base/Events";
import { cloneTemplate, ensureElement } from './utils/utils';
import { AppApi } from './components/AppApi';
import { ProductsData } from './components/model/ProductsData';
import { BasketData } from './components/model/BasketData';
import { OrderData } from './components/model/OrderData';
import { OrderDataBuilder } from './components/model/OrderDataBuilder';
import { SuccessData } from './components/model/SuccessData';
import { CardCatalog } from './components/view/CardCatalog';
import { CardBasket } from './components/view/CardBasket';
import { CardPreview } from './components/view/CardPreview';
import { Page } from './components/view/Page';
import { Basket } from './components/view/Basket';
import { Modal } from './components/view/Modal';
import { FormOrder } from './components/view/FormOrder';
import { FormContacts } from './components/view/FormContacts';
import { Success } from './components/view/Success';
import { IProduct, TCardCatalog, TId, TSuccessData, IFieldChangePayload } from './types';

//поиск контейнеров и темплейтов для классов представления
const containerPage = ensureElement<HTMLElement>('.page');
const containerModal = ensureElement<HTMLDivElement>('#modal-container');
const templateCardCatalog = ensureElement<HTMLTemplateElement>('#card-catalog');
const templateCardPreview = ensureElement<HTMLTemplateElement>('#card-preview');
const templateCardBasket = ensureElement<HTMLTemplateElement>('#card-basket');
const templateBasket = ensureElement<HTMLTemplateElement>('#basket');
const templateOrder = ensureElement<HTMLTemplateElement>('#order');
const templateContacts = ensureElement<HTMLTemplateElement>('#contacts');
const templateSuccess = ensureElement<HTMLTemplateElement>('#success');

//Генерация экземпляров классов EventEmitter и AppApi
const api = new AppApi(CDN_URL, API_URL);
const events = new EventEmitter();

//Генерация экземпляров классов слоя модели
const productsData = new ProductsData(events);
const basketData = new BasketData(events);
const orderDataBuilder = new OrderDataBuilder(events, OrderData);
const successData = new SuccessData(events);

//Генерация экземпляров классов слоя представления
const page = new Page(containerPage, events);
const modal = new Modal(containerModal, events);
const cardPreview = new CardPreview(cloneTemplate(templateCardPreview), events);
const basket = new Basket(cloneTemplate(templateBasket), events);
const formOrder = new FormOrder(cloneTemplate(templateOrder), events);
const formContacts = new FormContacts(cloneTemplate(templateContacts), events);
const success = new Success(cloneTemplate(templateSuccess), events);

//Обработка события изменения данных 
//получение данных с сервера
api.getProducts().then((data) => {
  productsData.products = data
}).catch(console.error)

//Реакция на изменение (получение) данных о продуктах 
events.on('products:changed', (products: IProduct[]) => {
  const cardsList = products.map((product) => {
    const card = new CardCatalog<TCardCatalog>(cloneTemplate(templateCardCatalog), events);
    return card.render(product)
 })
 page.render({catalog: cardsList})
});

//Обработка поведения модального окна 
//Событие открытия модального окна
events.on('modal:open', () => {
  page.lockScreen(true);
});

//Событие закрытия модального окна
events.on('modal:close', () => {
  page.lockScreen(false);
});

//Обработка пользовательских событий 
//Покупатель кликнул по иконке(кнопке) корзины на главной старанице
events.on('modal-basket:open', () => {
  modal.render({ content: basket.render({total: basketData.getTotal(), emptyCheck: basketData.getQuantity() === 0})});
  modal.open();
});

//Покупатель кликнул по карточке в каталоге на главной странице
events.on('modal-card:open',(data: TId) => {
  const productCorrect = productsData.getProduct(data.id);
  if(productCorrect) { 
  modal.render({ content: cardPreview.render({...productCorrect, priceCheck: Boolean(productCorrect.price), state: basketData.checkProduct(productCorrect.id)})});
  modal.open();
  }
});

//Добавление товара в корзину
events.on('purchases:add', (data: TId) => {
  basketData.addPurchase(productsData.getProduct(data.id))
});

//Удаление товара из корзины 
events.on('purchases:delete', (data: TId) => {
  basketData.deletePurchase(data.id)
});

//Изменение в покупках пользователя
events.on('purchases:changed', (data: TId) => {
  cardPreview.render({priceCheck: true, state: !basketData.checkProduct(data.id)});
  page.render({counter: basketData.getQuantity()});
  const purchasesList = basketData.purchases.map((purchase, index) => {
    const cardBasket = new CardBasket(cloneTemplate(templateCardBasket), events);
    return cardBasket.render({...purchase, index: ++index})
  });
  basket.render({cardsList: purchasesList, total: basketData.getTotal(), emptyCheck: basketData.getQuantity() === 0})
});

//Запись данных из корзины. Переход к форме доставки
events.on('modal-order:open', () => {
  modal.render({content: formOrder.render({valid: formOrder.valid})})
});

//Взаимодействие пользователя с полями формы доставки.
events.on('order:valid', () => {
  formOrder.valid = formOrder.valid;
  orderDataBuilder.deliveryInfo = {payment: formOrder.payment, address: formOrder.address}
});

//Переход к форме контактных данных
events.on(`order:submit`, () => {
  modal.render({content: formContacts.render({valid: formContacts.valid})})
});

//Взаимодействие пользователя с полями формы контактных данных
events.on('contacts:valid', () => {
  formContacts.valid = formContacts.valid;
  orderDataBuilder.contactsInfo = {email: formContacts.email, phone: formContacts.phone};
});

//Отправка заказа на сервер, получение данных от сервера, очистка корзины и формы
events.on('contacts:submit', () => {
  const order = {
    ...orderDataBuilder.getOrderData().customerInfo,
    total: basketData.getTotal(),
    items: basketData.getIdList()
  };

  api.postOrder(order).then((data: TSuccessData) => {
    successData.orderSuccess = data;
    formOrder.clear();
    formContacts.clear();
    basketData.clear();
  }).catch(console.error);
});

events.on('order:fieldChange', ({ fieldName, value }: IFieldChangePayload) => {
  orderDataBuilder.updateField(fieldName, value);

  const { valid, errors } = orderDataBuilder.validateDelivery();

  // одно место, которое управляет UI
  formOrder.valid = valid;
  formOrder.setErrors(errors);

  // если тебе нужно уведомить кого-то ещё:
  events.emit('order:validationErrors', errors);
  events.emit('order:valid', { valid });  // ОБЯЗАТЕЛЬНО объект, не boolean!
});

//Получение данных с сервера, запись в соответсвующий объект класса слоя данных
events.on('success:changed', (data: TSuccessData) => {
  modal.render({content: success.render({description: String(data.total)})})
});

//Успешная покупка. Закрытия окна нажатием на кнопку "За новыми покупками"
events.on('success:confirm', () => {
  modal.close();
})
