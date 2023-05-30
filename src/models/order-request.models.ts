export class OrderRequest {
    address_id: number;
    payment_method_id: number;
    payment_method_slug: string;
    coupon_code: string;
    products: Array<{ id: number; quantity: number; }>;
    meta: string;

    constructor() {
        this.products = new Array<{ id: number; quantity: number; }>();
    }
}