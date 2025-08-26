from django.contrib import admin
from .models import (
    User, UserProfile, Patient, Doctor, Hospital, Appointment, 
    Prescription, Conversation, Message, Medicine, Cart, CartItem, 
    Order, OrderItem, PaymentMethod, PrivacySettings, AccountSecurity, SupportTicket, SupportReply
)

admin.site.register(User)
admin.site.register(UserProfile)
admin.site.register(Patient)
admin.site.register(Doctor)
admin.site.register(Hospital)
admin.site.register(Appointment)
admin.site.register(Prescription)
admin.site.register(Conversation)
admin.site.register(Message)

# Pharmacy Models
@admin.register(Medicine)
class MedicineAdmin(admin.ModelAdmin):
    list_display = ['name', 'generic_name', 'category', 'price', 'stock_quantity', 'is_active']
    list_filter = ['category', 'is_active', 'is_prescription_required', 'manufacturer']
    search_fields = ['name', 'generic_name', 'description']
    ordering = ['name']

@admin.register(Cart)
class CartAdmin(admin.ModelAdmin):
    list_display = ['user', 'total_amount', 'get_item_count', 'is_active', 'created_at']
    list_filter = ['is_active', 'created_at']
    search_fields = ['user__email', 'user__username']
    
    def get_item_count(self, obj):
        return obj.items.count()
    get_item_count.short_description = 'Items'

@admin.register(CartItem)
class CartItemAdmin(admin.ModelAdmin):
    list_display = ['cart', 'medicine', 'quantity', 'subtotal', 'added_at']
    list_filter = ['added_at']
    search_fields = ['cart__user__email', 'medicine__name']

@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ['order_id', 'user', 'status', 'total_amount', 'payment_method', 'created_at']
    list_filter = ['status', 'payment_method', 'delivery_option', 'created_at']
    search_fields = ['order_id', 'user__email', 'user__username']
    readonly_fields = ['order_id', 'created_at', 'updated_at']
    actions = ['approve_orders', 'ship_orders', 'mark_delivered']
    
    def approve_orders(self, request, queryset):
        updated = queryset.filter(status='pending').update(status='confirmed')
        self.message_user(request, f'{updated} orders have been approved.')
    approve_orders.short_description = "Approve selected pending orders"
    
    def ship_orders(self, request, queryset):
        updated = queryset.filter(status='confirmed').update(status='shipped')
        self.message_user(request, f'{updated} orders have been marked as shipped.')
    ship_orders.short_description = "Mark selected confirmed orders as shipped"
    
    def mark_delivered(self, request, queryset):
        updated = queryset.filter(status='shipped').update(status='delivered')
        self.message_user(request, f'{updated} orders have been marked as delivered.')
    mark_delivered.short_description = "Mark selected shipped orders as delivered"

@admin.register(OrderItem)
class OrderItemAdmin(admin.ModelAdmin):
    list_display = ['order_item_id', 'order', 'medicine', 'quantity', 'price']
    list_filter = ['order__status']
    search_fields = ['order__order_id', 'medicine__name']

@admin.register(PaymentMethod)
class PaymentMethodAdmin(admin.ModelAdmin):
    list_display = ['payment_method_id', 'user', 'type', 'name', 'masked_number', 'is_default', 'is_active']
    list_filter = ['type', 'is_default', 'is_active', 'created_at']
    search_fields = ['user__email', 'name', 'masked_number']
    readonly_fields = ['payment_method_id', 'masked_number', 'created_at', 'updated_at']


@admin.register(PrivacySettings)
class PrivacySettingsAdmin(admin.ModelAdmin):
    list_display = [
        'user',
        'show_profile_to_doctors',
        'show_contact_info_to_doctors',
        'allow_marketing_emails',
        'share_anonymized_analytics',
        'allow_chat_requests',
        'created_at',
    ]
    list_filter = ['show_profile_to_doctors', 'allow_marketing_emails', 'share_anonymized_analytics', 'allow_chat_requests']
    search_fields = ['user__email']


@admin.register(AccountSecurity)
class AccountSecurityAdmin(admin.ModelAdmin):
    list_display = ['user', 'is_totp_enabled', 'created_at']
    list_filter = ['is_totp_enabled']
    search_fields = ['user__email']


@admin.register(SupportTicket)
class SupportTicketAdmin(admin.ModelAdmin):
    list_display = ['ticket_id', 'user', 'subject', 'status', 'priority', 'created_at']
    list_filter = ['status', 'priority', 'created_at']
    search_fields = ['subject', 'user__email']


@admin.register(SupportReply)
class SupportReplyAdmin(admin.ModelAdmin):
    list_display = ['reply_id', 'ticket', 'sender', 'created_at']
    list_filter = ['created_at']
    search_fields = ['ticket__subject', 'sender__email']
