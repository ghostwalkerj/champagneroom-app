<script lang="ts">
  import {
    PUBLIC_CREATOR_SIGNUP_PATH,
    PUBLIC_STATIC_URL
  } from '$env/static/public';
</script>

<div id="Creators" data-aos="zoom-in-right">
  <div class="container mx-auto">
    <div class="pt-10 lg:pt-52">
      <h2
        class="text-primary font-bold text-[41px] text-center font-CaviarDreams lg:mb-10"
      >
        Become a Creator
      </h2>
      <div
        class="flex flex-col lg:flex-row p-4 items-center place-content-center lg:px-10"
      >
        <div
          class="w-full m-3 p-4 flex place-content-center"
          data-aos="flip-right"
        >
          <img
            src="{PUBLIC_STATIC_URL}/assets/creator.png"
            alt="Creator"
            class="rounded-xl overflow-hidden shadow-[0px_0px_17px_6px_#e779c1]"
          />
        </div>
        <div class="w-full">
          <span
            class="text-info text-lg font-bold capitalize lg:ml-5 lg:tracking-wider text-center flex font-CaviarDreams"
          >
            Benefits
          </span>
          <ul
            class="text-left list-disc lg:ml-5
          list-inside text-lg"
          >
            <li>Get paid quickly in your local money.</li>
            <li>
              Easily handle payments without worrying about issues and
              restrictions.
            </li>
            <li>
              Be safe and keep your info private—no need for names or phone
              numbers.
            </li>
            <li>Get tips from your fans.</li>
            <li>Sell custom content to your followers.</li>
            <li>
              Connect with well-to-do customers worldwide, regardless of your
              location.
            </li>
          </ul>
          <span
            class="text-info text-lg font-bold capitalize lg:ml-5 tracking-wider text-center flex font-CaviarDreams mt-5"
          >
            Get Started Now
          </span>
          <ul
            class="text-left list-disc lg:ml-5
          list-inside text-lg"
          >
            <li>
              Make sure you have a crypto wallet. If you don't have one, we
              suggest using <a
                href="https://metamask.io/download/"
                class="link link-primary"
                target="_blank">MetaMask</a
              >.
            </li>
            <li>
              Once you've got a wallet, follow the steps to set up your account.
            </li>
            <li>
              Keep your account secure – this is where your earnings will be
              sent and it's also needed to log into your Champagne Room account.
            </li>
            <li>
              Visit the <a
                href={PUBLIC_CREATOR_SIGNUP_PATH}
                target="_blank"
                class="link link-primary"
              >
                Creator Sign Up Page.
              </a>
            </li>
            <li>
              You're free to pick any name you like, though a stage name is
              recommended. Remember, Champagne Room won't request your personal
              info.
            </li>
            <li>Add a profile photo that'll be shown during your shows.</li>
            <li>
              To complete the registration, simply sign a message in your
              wallet. This step verifies your ownership of the wallet address,
              and it won't cost you any fees. You'll never need to send us any
              of your crypto.
            </li>
            <li>
              That's it! You're all set to start crafting shows and earning
              money.
            </li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</div>
