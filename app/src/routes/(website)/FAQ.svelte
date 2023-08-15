<script lang="ts">
  import { PUBLIC_STATIC_URL } from '$env/static/public';
</script>

<div data-aos="fade-In" class="container mx-auto relative pt-52" id="FAQ">
  <div class="absolute top-60 grid grid-cols-2">
    <div
      class="image opacity-20 max-width-l hidden md:flex animate-pulse transition-timing-function"
    >
      <div class="h-xl w-xl">
        <img
          class="motion-safe:animate-fadeIn mx-auto rounded-lg opacity-45 justify-center -space-x-20 w-m h-m"
          src="{PUBLIC_STATIC_URL}/assets/ladyblue.png"
          alt="Lady Blue"
        />
      </div>
    </div>

    <div
      class="image opacity-20 hidden md:flex animate-pulse transition-timing-function"
    >
      <div class="h-xl w-xl">
        <img
          class="motion-safe:animate-fadeIn mx-auto rounded-lg opacity-45 justify-center -space-x-20 w-m h-m"
          src="{PUBLIC_STATIC_URL}/assets/ladypink.png"
          alt="Lady Pink"
        />
      </div>
    </div>
  </div>
  <h2
    class="font-bold text-primary text-[41px] text-center mt-36 font-CaviarDreams"
  >
    FAQ
  </h2>

  <div class="block sm:flex sm:flex-row mt-10 gap-10 mx-10">
    <div class="w-full sm:w-1/2">
      <div class="collapse collapse-arrow">
        <input type="radio" name="faq-accordion" />
        <div class="collapse-title text-xl font-medium">
          What is Champagne Room?
        </div>
        <div class="collapse-content text-info">
          <div class="flex flex-col gap-2">
            <div class="">
              Champagne Room is a platform that provides a private and secure
              space where anyone can pay for a live, one-on-one video show with
              a performer of their choice. Just like a real Champagne Room,
              users are offered a personal VIP experience in a safe environment.
              In simple terms, if you want a video show with a performer, you
              can use Champagne Room to pay for the performance securely,
              anonymously, and with the support of a full escrow system.
            </div>
          </div>
        </div>
      </div>
      <div class="collapse collapse-arrow">
        <input type="radio" name="faq-accordion" />
        <div class="collapse-title text-xl font-medium">How does it work?</div>
        <div class="collapse-content text-info">
          <ol class="list-decimal ml-4">
            <li>
              Once you and the creator agree to a video performance, the creator
              will generate a unique, one-time link that will be shared with
              you.
            </li>
            <li>
              The link will bring you to the show page, where the agreed price
              and duration will be displayed. You will have options to purchase
              a ticket for the show.
            </li>
            <li>
              Complete the payment to the Champagne Room wallet. The Champagne
              Room holds the payment until after the show is completed.
            </li>
            <li>
              After the transaction is confirmed, the creator can start the
              show. Your ticket will indicate when the show has begun.
            </li>
            <li>
              Enjoy the private show! Your presence will remain confidential.
              Relax!
            </li>
            <li>
              After the show ends, you will have the opportunity to provide
              feedback about your experience.
            </li>
            <li>The creator is paid for the show.</li>
          </ol>
        </div>
      </div>
      <div class="collapse collapse-arrow">
        <input type="radio" name="faq-accordion" />
        <div class="collapse-title text-xl font-medium">
          How are my transactions protected?
        </div>
        <div class="collapse-content text-info">
          <div>
            When you make a payment, it does not go directly to the creator;
            instead, it is held in escrow. The escrow is only released after the
            show ends and you have the chance to provide feedback.
          </div>
          <ul class="list-disc ml-4">
            <li>If the creator cancels the show, you will receive a refund.</li>
            <li>
              If the creator fails to start the show, you will receive a refund.
            </li>
            <li>
              If you are dissatisfied with the show, you can initiate a dispute
              and request a refund.
            </li>
          </ul>
        </div>
      </div>
    </div>
    <div class="w-full sm:w-1/2">
      <div class="collapse collapse-arrow">
        <input type="radio" name="faq-accordion" />
        <div class="collapse-title text-xl font-medium">Is it anonymous?</div>
        <div class="collapse-content text-info">
          <div>
            We do not collect any data from our users, including email addresses
            or credit card information. When purchasing a ticket, you can enter
            any name you wish and create a PIN to identify yourself for future
            use if desired.
          </div>
          <div class="pt-4">
            When you return for another show (which we believe you will because
            Champagne Room is awesome), you can use a different name if you
            prefer. Our philosophy is that adults should be able to transact
            privately, without interference from us or anyone else.
          </div>
        </div>
      </div>
      <div class="collapse collapse-arrow">
        <input type="radio" name="faq-accordion" />
        <div class="collapse-title text-xl font-medium">
          How is it different from other platforms like Only Fans?
        </div>
        <div class="collapse-content text-info">
          <ul class="list-disc ml-4">
            <li>
              Firstly, unlike OnlyFans, we do not use credit cards; we use
              cryptocurrency for transactions. This means that credit card
              statements will not reveal any details to your spouse or others.
            </li>
            <li>
              OnlyFans collects your identity, whereas we do not. This is the
              most significant difference between us.
            </li>
            <li>
              OnlyFans creators are required to have a bank account in their own
              name, which excludes those who are unbanked. Champagne Room does
              not have this requirement.
            </li>
          </ul>
        </div>
      </div>
      <div class="collapse collapse-arrow">
        <input type="radio" name="faq-accordion" />
        <div class="collapse-title text-xl font-medium">
          What is the road map and future of Champagne Room?
        </div>
        <div class="collapse-content text-info">
          <ul class="list-disc ml-4">
            <li>
              As we receive feedback from our users, we will enhance Champagne
              Room's features.
            </li>
            <li>
              Currently, shows are one-on-one, but we plan to expand to
              one-to-many.
            </li>
            <li>
              The creator will be able to customize their own Champagne Rooms to
              reflect their style and preferences.
            </li>
            <li>
              The creator will have the option to sell media directly from their
              private pages using cryptocurrency.
            </li>
            <li>
              We plan to offer a token that will grant users special privileges
              with the creator, such as access to free private events,
              personalized NFTs, and the ability to participate in equity
              earning.
            </li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</div>
