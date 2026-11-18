# Интеграция прототипа LidO в HostCMS

Данный прототип спроектирован модульно для поэтапного переноса в шаблоны и XSL-преобразования **HostCMS**.

## 1. Структура модулей и маппинг на HostCMS
- `data-hostcms-block="hero_editorial"` → Макет главной страницы (`template1`), блок баннера/структуры.
- `data-hostcms-block="shop_catalog"` → Контроллер `Shop_Controller_Show` (вывод групп и товаров `shop_items` с атрибутами `data-hostcms-item-id` и `data-hostcms-group-id`).
- `data-hostcms-block="total_look_builder"` → Комплекты/наборы `Shop_Item_Set` или связанные товары (`associated`).
- `data-hostcms-block="smart_fit_calculator"` → Интерактивный виджет в XSL-шаблоне карточки/раздела с передачей параметров в Telegram-ссылку.
- Корзина (`#cartDrawer`) → Интеграция с `Shop_Cart_Controller_Show` через AJAX (`/shop/cart/`).

## 2. Рекомендации по исправлению текущих багов на боевом сайте
1. **Битые ссылки**: убрать/перенаправить `/obrazy-so-skidkoj/` (404) на `/klassicheskie-obrazy-so-skidkoj/`.
2. **Дублирующиеся блоки хитов**: заменить захардкоженный блок `Юбка 1289` в XSL-шаблоне категорий на динамическую выборку `Shop_Controller_Show` по флагу `hit`.
3. **Размеры в карточке**: разделить название размера (`46-48`) и остаток на складе в XSL, чтобы не склеивалось в `46-48450-524`.
4. **Отладочный текст**: удалить вывод брейкпоинтов (`XS 1920 SM 1920...`) из `template1`.
