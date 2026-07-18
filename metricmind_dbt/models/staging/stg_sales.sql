select
       transaction_id,
       date as sale_date,
       region,
       product_category,
       revenue,
       cost,
       revenue - cost as margin
   from {{ source('raw', 'raw_sales') }}