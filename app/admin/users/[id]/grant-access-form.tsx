"use client";

import { useState } from "react";
import { grantAccess } from "./actions";

type Product = {
  id: string;
  code: string;
  title: string;
  price: number | null;
  is_free: boolean;
};

type Props = {
  userId: string;
  products: Product[];
};

export default function GrantAccessForm({
  userId,
  products,
}: Props) {
  const [productId, setProductId] = useState("");
  const [accessType, setAccessType] = useState("free");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (!productId) {
      setMessage("اختار المحتوى أولاً.");
      setSuccess(false);
      return;
    }

    setLoading(true);
    setMessage("");

    const result = await grantAccess(
      userId,
      productId,
      accessType
    );

    setLoading(false);
    setMessage(result.message);
    setSuccess(result.success);

    if (result.success) {
      setProductId("");
      setAccessType("free");
    }
  }

  return (
    <div className="mt-8 rounded-2xl border border-white/[0.07] bg-[#101010] p-6">

      <div>
        <p className="text-xs tracking-[0.2em] text-gray-600">
          GRANT ACCESS
        </p>

        <h2 className="mt-3 text-xl font-semibold">
          منح صلاحية وصول
        </h2>

        <p className="mt-2 text-sm text-gray-500">
          اختر المحتوى الذي تريد إضافته إلى مكتبة المستخدم.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="mt-6 space-y-5"
      >

        {/* PRODUCT */}

        <div>
          <label className="mb-2 block text-sm text-gray-400">
            المحتوى
          </label>

          <select
            value={productId}
            onChange={(event) =>
              setProductId(event.target.value)
            }
            className="w-full rounded-xl border border-white/[0.08] bg-[#080808] px-4 py-3 text-sm text-white outline-none transition focus:border-white/20"
          >
            <option value="">
              اختر المحتوى
            </option>

            {products.map((product) => (
              <option
                key={product.id}
                value={product.id}
              >
                {product.code} — {product.title}
              </option>
            ))}
          </select>
        </div>

        {/* ACCESS TYPE */}

        <div>
          <label className="mb-2 block text-sm text-gray-400">
            نوع الوصول
          </label>

          <select
            value={accessType}
            onChange={(event) =>
              setAccessType(event.target.value)
            }
            className="w-full rounded-xl border border-white/[0.08] bg-[#080808] px-4 py-3 text-sm text-white outline-none transition focus:border-white/20"
          >
            <option value="free">
              مجاني
            </option>

            <option value="paid">
              مدفوع
            </option>
          </select>
        </div>

        {/* BUTTON */}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-white px-5 py-3 text-sm font-semibold text-black transition hover:bg-gray-300 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading
            ? "جاري منح الوصول..."
            : "منح صلاحية الوصول"}
        </button>

      </form>

      {/* MESSAGE */}

      {message && (
        <div
          className={`mt-5 rounded-xl border p-4 text-sm ${
            success
              ? "border-white/[0.08] bg-white/[0.03] text-gray-300"
              : "border-red-500/20 bg-red-500/[0.06] text-red-400"
          }`}
        >
          {message}
        </div>
      )}

    </div>
  );
}
