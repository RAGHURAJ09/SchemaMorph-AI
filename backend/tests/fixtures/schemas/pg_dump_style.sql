-- pg_dump style: ALTER TABLE ADD CONSTRAINT for FK (common in real dumps)
CREATE TABLE users (
    id integer NOT NULL,
    email character varying(255) NOT NULL,
    name character varying(100),
    created_at timestamp without time zone
);

ALTER TABLE users ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY;

CREATE TABLE orders (
    id integer NOT NULL,
    user_id integer NOT NULL,
    total numeric(10,2),
    status character varying(50)
);

ALTER TABLE orders ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY;

CREATE TABLE order_items (
    id integer NOT NULL,
    order_id integer NOT NULL,
    product_id integer NOT NULL,
    quantity integer NOT NULL,
    unit_price numeric(10,2)
);

ALTER TABLE public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);

ALTER TABLE public.orders
    ADD CONSTRAINT orders_pkey PRIMARY KEY (id);

ALTER TABLE public.order_items
    ADD CONSTRAINT order_items_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id);

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id);
