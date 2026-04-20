CREATE TABLE "agent_conversations" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"title" text DEFAULT 'New Conversation' NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "agent_messages" (
	"id" serial PRIMARY KEY NOT NULL,
	"conversation_id" integer NOT NULL,
	"role" text NOT NULL,
	"content" text NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "scheduled_transactions" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"user_account_id" integer NOT NULL,
	"type" text NOT NULL,
	"amount" numeric(12, 2) NOT NULL,
	"scheduled_date" timestamp NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "user_accounts" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"bank_name" text NOT NULL,
	"account_number" text,
	"routing_number" text,
	"bonus_amount" integer DEFAULT 0 NOT NULL,
	"direct_deposit_required" integer DEFAULT 0 NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"approval_status" text DEFAULT 'pending' NOT NULL,
	"approved_at" timestamp,
	"opened_at" timestamp DEFAULT now(),
	"bonus_received_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "user_credits" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"total_credits" numeric(12, 2) DEFAULT '0' NOT NULL,
	"used_credits" numeric(12, 2) DEFAULT '0' NOT NULL,
	"stripe_payment_intent_id" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "doc_bonuses" (
	"id" serial PRIMARY KEY NOT NULL,
	"guid" text NOT NULL,
	"title" text NOT NULL,
	"link" text NOT NULL,
	"description" text,
	"bank_name" text,
	"bonus_amount" integer,
	"category" text DEFAULT 'bank' NOT NULL,
	"pub_date" timestamp,
	"fetched_at" timestamp DEFAULT now(),
	"offer_link" text,
	"doc_post_link" text,
	"pull_type" text,
	"cc_funding" text,
	"direct_deposit_info" text,
	"section" text,
	"rank" integer,
	"source" text DEFAULT 'rss',
	"state_restriction" text,
	"nationwide" boolean DEFAULT false,
	"pinned" boolean DEFAULT false,
	CONSTRAINT "doc_bonuses_guid_unique" UNIQUE("guid")
);
--> statement-breakpoint
CREATE TABLE "plaid_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"item_id" text NOT NULL,
	"access_token" text NOT NULL,
	"institution_id" text,
	"institution_name" text,
	"accounts" jsonb,
	"status" text DEFAULT 'active' NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "plaid_items_item_id_unique" UNIQUE("item_id")
);
--> statement-breakpoint
CREATE TABLE "autopay_schedules" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"bonus_guid" text,
	"bank_name" text,
	"bonus_amount" integer,
	"offer_link" text,
	"section" text,
	"account_last4" text,
	"routing_number" text,
	"stripe_bank_token_id" text,
	"stripe_customer_id" text,
	"stripe_payment_method_id" text,
	"dd_amount" integer,
	"charge_amount" integer,
	"ach_amount" integer,
	"leverage_charge_amount" integer,
	"cycle_count" integer DEFAULT 0,
	"max_cycles" integer DEFAULT 18,
	"ends_at" timestamp,
	"next_action_at" timestamp,
	"next_action_type" text,
	"cycle_interval_biz_days" integer DEFAULT 2,
	"discount_pct" integer DEFAULT 0,
	"dd_out_date" timestamp,
	"dd_in_date" timestamp,
	"refund_date" timestamp,
	"status" text DEFAULT 'pending_charge' NOT NULL,
	"stripe_charge_id" text,
	"stripe_transfer_out_id" text,
	"stripe_transfer_in_id" text,
	"stripe_refund_id" text,
	"notify_email" text,
	"notify_phone" text,
	"push_token" text,
	"plaid_access_token" text,
	"plaid_account_id" text,
	"demo" boolean DEFAULT false,
	"notes" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "subscriptions" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"plan" text DEFAULT 'free' NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"stripe_customer_id" text,
	"stripe_subscription_id" text,
	"stripe_price_id" text,
	"stripe_default_payment_method_id" text,
	"billing_email" text,
	"payment_method_collected_at" timestamp,
	"current_period_start" timestamp,
	"current_period_end" timestamp,
	"cancel_at_period_end" boolean DEFAULT false,
	"trial_end" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "subscriptions_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "monitor_events" (
	"id" serial PRIMARY KEY NOT NULL,
	"source_url" text NOT NULL,
	"source_category" text NOT NULL,
	"source_name" text,
	"change_type" text NOT NULL,
	"summary" text NOT NULL,
	"severity" text DEFAULT 'info' NOT NULL,
	"affected_banks" jsonb DEFAULT '[]'::jsonb,
	"raw_snippet" text,
	"detected_at" timestamp DEFAULT now(),
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "monitor_runs" (
	"id" serial PRIMARY KEY NOT NULL,
	"started_at" timestamp DEFAULT now(),
	"completed_at" timestamp,
	"sources_checked" integer DEFAULT 0,
	"events_detected" integer DEFAULT 0,
	"errors_encountered" integer DEFAULT 0,
	"status" text DEFAULT 'running' NOT NULL,
	"notes" text
);
--> statement-breakpoint
CREATE TABLE "source_health" (
	"id" serial PRIMARY KEY NOT NULL,
	"source_url" text NOT NULL,
	"source_category" text NOT NULL,
	"source_name" text,
	"is_alive" boolean DEFAULT true,
	"last_status_code" integer,
	"last_checked_at" timestamp DEFAULT now(),
	"response_time_ms" integer,
	"error_message" text,
	"consecutive_failures" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "source_health_source_url_unique" UNIQUE("source_url")
);
--> statement-breakpoint
CREATE TABLE "file_uploads" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"file_name" text NOT NULL,
	"file_size" integer NOT NULL,
	"content_type" text NOT NULL,
	"object_path" text NOT NULL,
	"category" text DEFAULT 'other' NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "user_profiles" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"bank_score" integer,
	"ews_score" integer,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "user_profiles_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "deposit_orders" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"deposit_amount" integer DEFAULT 50000 NOT NULL,
	"service_fee" integer DEFAULT 9900 NOT NULL,
	"tax_amount" integer DEFAULT 0 NOT NULL,
	"stripe_fee" integer DEFAULT 0 NOT NULL,
	"total_charged" integer NOT NULL,
	"user_state" text,
	"account_last4" text NOT NULL,
	"routing_number" text NOT NULL,
	"stripe_customer_id" text,
	"stripe_payment_method_id" text,
	"stripe_payment_intent_id" text,
	"stripe_transfer_id" text,
	"plaid_authorization_id" text,
	"plaid_transfer_id" text,
	"plaid_transfer_status" text,
	"ach_scheduled_date" timestamp,
	"ach_amount" integer DEFAULT 50000 NOT NULL,
	"status" text DEFAULT 'pending_charge' NOT NULL,
	"stacked_offers_count" integer,
	"stacked_offers_total" integer,
	"demo" boolean DEFAULT false,
	"notes" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "client_notes" (
	"id" serial PRIMARY KEY NOT NULL,
	"lead_id" integer NOT NULL,
	"rep_id" integer NOT NULL,
	"content" text NOT NULL,
	"note_type" text DEFAULT 'general' NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "commissions" (
	"id" serial PRIMARY KEY NOT NULL,
	"rep_id" integer NOT NULL,
	"lead_id" integer,
	"client_user_id" text,
	"type" text NOT NULL,
	"amount" numeric(12, 2) NOT NULL,
	"description" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"paid_at" timestamp,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "leads" (
	"id" serial PRIMARY KEY NOT NULL,
	"rep_id" integer NOT NULL,
	"first_name" text NOT NULL,
	"last_name" text NOT NULL,
	"email" text NOT NULL,
	"phone" text,
	"source" text,
	"stage" text DEFAULT 'new' NOT NULL,
	"estimated_value" numeric(12, 2),
	"notes" text,
	"last_contacted_at" timestamp,
	"converted_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "sales_reps" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"phone" text,
	"avatar" text,
	"commission_rate" numeric(5, 2) DEFAULT '10.00' NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"total_earnings" numeric(12, 2) DEFAULT '0' NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "sales_reps_user_id_unique" UNIQUE("user_id")
);
