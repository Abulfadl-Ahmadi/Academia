# Automatic sale SMS notifications

Configure `Finance > SMS notification configs` in Django admin.

Set `SMS_IR_API_KEY` and `SMS_IR_LINE_NUMBER` in the environment before enabling delivery.

- `is_active`: enables delivery.
- `trigger_statuses`: use `paid` and/or `confirmed`; pending and failed orders are never sent.
- `message_type=bulk`: uses `template_text` and the sms.ir bulk endpoint.
- `message_type=verify`: uses `template_id`; `template_parameters` is a JSON object whose values may use order variables such as `{order_code}`, `{total_amount}`, and `{product_titles}`.
- Recipients come from selected admin/finance users (their profile/address phone) and `custom_phone_numbers`. Duplicates are removed.

Available template variables are: `{order_code}`, `{customer_name}`, `{customer_phone}`, `{total_amount}`, `{product_titles}`, `{product_types}`, `{order_date}`, and `{items_count}`.

Every delivery attempt is stored in `SMSNotificationLog` with its status and provider response. SMS failures are best-effort and do not roll back a paid order.
