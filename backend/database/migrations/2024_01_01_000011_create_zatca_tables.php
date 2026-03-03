<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('zatca_configs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('branch_id')->constrained('branches');
            $table->text('certificate')->nullable();
            $table->text('private_key')->nullable();
            $table->text('csr')->nullable();
            $table->string('production_csid')->nullable();
            $table->string('compliance_csid')->nullable();
            $table->boolean('is_production')->default(false);
            $table->timestamps();
        });

        Schema::create('zatca_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('sale_id')->constrained('sales');
            $table->uuid('uuid');
            $table->string('invoice_hash')->nullable();
            $table->longText('xml_content')->nullable();
            $table->text('qr_code')->nullable();
            $table->enum('status', ['pending', 'cleared', 'reported', 'error'])->default('pending');
            $table->text('response')->nullable();
            $table->text('error_message')->nullable();
            $table->timestamps();
        });

        Schema::create('stock_movements', function (Blueprint $table) {
            $table->id();
            $table->foreignId('branch_id')->constrained('branches');
            $table->foreignId('product_id')->constrained('products');
            $table->enum('type', ['in', 'out', 'transfer_in', 'transfer_out', 'adjust']);
            $table->integer('quantity');
            $table->integer('balance_after')->default(0);
            $table->string('reference_type')->nullable();
            $table->unsignedBigInteger('reference_id')->nullable();
            $table->text('notes')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('stock_movements');
        Schema::dropIfExists('zatca_logs');
        Schema::dropIfExists('zatca_configs');
    }
};
